import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { generateImagesForOrder } from '@/lib/ai/generation';
import { sendProcessingEmail } from '@/lib/email';
import path from 'path';
import fs from 'fs';

// Helper to download image from URL to local buffer
async function downloadImage(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        return Buffer.from(await response.arrayBuffer());
    } catch (e) {
        console.error("Failed to download image:", e);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const text = await req.text();
        const topic = req.headers.get('x-shopify-topic') || '';
        const hmac = req.headers.get('x-shopify-hmac-sha256') || '';
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';

        // 1. Verify HMAC
        if (process.env.NODE_ENV === 'production' || process.env.SHOPIFY_WEBHOOK_SECRET) {
            const hash = crypto
                .createHmac('sha256', secret)
                .update(text, 'utf8')
                .digest('base64');

            if (hash !== hmac) {
                console.error("Invalid Webhook HMAC");
                return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
            }
        }

        const payload = JSON.parse(text);

        console.log(`[Shopify Webhook] Received topic: ${topic}`);

        // 2. Extract Data
        const customerEmail = payload.email || payload.customer?.email;
        const customerName = payload.customer ? `${payload.customer.first_name} ${payload.customer.last_name}` : 'Guest';

        // Extract Shopify order metadata
        const shopifyOrderNumber = payload.order_number || payload.name || null; // e.g., #1234 or "#1001"
        const shopifyTotalPrice = payload.total_price ? Math.round(parseFloat(payload.total_price) * 100) : null; // Convert to cents
        const shopifyNotes = payload.note || ''; // Customer notes from Shopify checkout

        // Loop through line items to find the "Portrait" product
        let lineItemFound = false;

        for (const item of payload.line_items) {
            const properties = item.properties || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const propsMap: Record<string, any> = {};
            properties.forEach((p: { name: string, value: string }) => {
                propsMap[p.name.toLowerCase()] = p.value;
            });

            // Look for common file upload keys or just "Pet Photo"
            const photoUrl = propsMap['pet photo'] || propsMap['upload'] || propsMap['photo'] || null;
            const breed = propsMap['breed'] || propsMap['pet breed'] || '';
            const petName = propsMap['name'] || propsMap['pet name'] || propsMap['dog name'] || '';
            const special = propsMap['special'] || propsMap['what makes them special'] || propsMap['details'] || propsMap['notes'] || '';

            // Collect all into fullDetails
            const explicitKeys = ['pet photo', 'upload', 'photo', 'breed', 'pet breed', 'name', 'pet name', 'dog name', 'special', 'what makes them special', 'details', 'notes'];
            const extraProps = Object.entries(propsMap)
                .filter(([k]) => !explicitKeys.includes(k))
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');

            const fullDetails = [
                special ? `Special: ${special}` : '',
                petName ? `Name: ${petName}` : '',
                extraProps ? `Other: ${extraProps}` : '',
                `[Shopify ID: ${payload.id}]`
            ].filter(Boolean).join('. ');

            if (photoUrl) {
                lineItemFound = true;
                console.log(`[Shopify] Found printable item: ${item.name}`);

                const safeName = `shopify-${payload.id}-${Date.now()}.jpg`;
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pets');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                console.log(`[Shopify] Downloading pet photo from ${photoUrl}...`);
                const imageBuffer = await downloadImage(photoUrl);

                let storageUrl = '';
                if (imageBuffer) {
                    // Upload to Supabase Storage
                    const storagePath = `uploads/pets/${safeName}`;
                    try {
                        const { uploadFile, getPublicUrl } = await import('@/lib/supabase/storage');
                        await uploadFile(storagePath, imageBuffer);
                        storageUrl = getPublicUrl(storagePath);
                        console.log(`[Shopify] Uploaded to storage: ${storageUrl}`);
                    } catch (err) {
                        console.error("Failed to upload to storage:", err);
                        continue;
                    }
                } else {
                    console.error("Could not download image, skipping generation for this item.");
                    continue;
                }

                // Create Order in Supabase
                const supabase = createAdminClient();
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        customer_name: customerName,
                        customer_email: customerEmail,
                        product_type: item.name || 'Shopify Order',
                        pet_image_url: storageUrl,
                        status: 'pending',
                        pet_breed: breed || null,
                        pet_name: petName || null,
                        pet_details: fullDetails,
                        shopify_order_number: shopifyOrderNumber,
                        shopify_total_price: shopifyTotalPrice,
                        shopify_notes: shopifyNotes,
                        source: 'shopify'
                    })
                    .select()
                    .single();

                if (orderError) {
                    console.error("Failed to create order in DB:", orderError);
                    continue;
                }

                console.log(`[Shopify] Order created: ${order.id}`);

                // Send Processing Email (immediate confirmation)
                if (petName) {
                    sendProcessingEmail(customerEmail, customerName, petName).catch(e => {
                        console.error('[Shopify] Failed to send processing email:', e);
                    });
                } else {
                    console.log('[Shopify] Skipping processing email - no pet name available');
                }

                // Trigger Generation
                // Pass the product type (item.name) so generation.ts can map it to 'spaday', 'royalty', etc.
                generateImagesForOrder(order.id, storageUrl, item.name, breed, fullDetails, false, petName).catch(err => {
                    console.error(`[Shopify] Generation failed for order ${order.id}:`, err);
                });
            }
        }

        if (!lineItemFound) {
            console.log("[Shopify] No item with 'Pet Photo' found in this order.");
        }

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        console.error('Webhook processing failed:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
