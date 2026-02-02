
import { PRINTIFY_PRODUCT_MAP } from './config';

interface OrderDetails {
    orderId: string;
    customerEmail: string;
    customerName: string;
    imageUrl: string; // The URL of the image to print
    productType: string; // 'canvas-11x14', etc.
    shippingAddress?: {
        line1: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }
}

export class PrintifyService {
    private static API_BASE = 'https://api.printify.com/v1';


    private static get SHOP_ID() {
        return process.env.PRINTIFY_SHOP_ID;
    }

    private static get TOKEN() {
        return process.env.PRINTIFY_API_TOKEN;
    }

    static async createOrder(details: OrderDetails) {
        console.log(`[Printify] Preparing order for ${details.orderId} (${details.productType})`);

        // 1. Resolve Product Config
        const config = PRINTIFY_PRODUCT_MAP[details.productType];
        if (!config || config.blueprint_id === 0) {
            console.warn(`[Printify] Skipping: No valid printify config for ${details.productType}`);
            return null;
        }

        // 2. Check for Mock Mode
        if (!this.TOKEN || !this.SHOP_ID) {
            console.log('⚠️ [Printify Mock Mode] API Token or Shop ID missing. Logging payload only.');
            console.log('Payload:', JSON.stringify(this.buildPayload(details, config), null, 2));
            return 'mock-print-id-' + Date.now();
        }

        try {
            const response = await fetch(`${this.API_BASE}/shops/${this.SHOP_ID}/orders.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.TOKEN}`
                },
                body: JSON.stringify(this.buildPayload(details, config))
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Printify API Error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log(`[Printify] Order Created Successfully! ID: ${data.id}`);
            return data.id;

        } catch (error) {
            console.error('[Printify] Failed to create order:', error);
            // Don't throw, just log. We don't want to break the user flow if fulfillment fails.
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static buildPayload(details: OrderDetails, config: any) {
        return {
            external_id: details.orderId,
            label: `Order ${details.orderId} - ${details.customerName}`,
            line_items: [
                {
                    print_provider_id: config.print_provider_id,
                    blueprint_id: config.blueprint_id,
                    variant_id: config.variant_id,
                    print_areas: {
                        front: [
                            {
                                src: details.imageUrl, // Must be a public URL
                            }
                        ]
                    },
                    quantity: 1
                }
            ],
            shipping_method: 1, // 1 = Standard
            send_shipping_notification: true,
            address_to: {
                first_name: details.customerName.split(' ')[0] || 'Customer',
                last_name: details.customerName.split(' ').slice(1).join(' ') || '.',
                email: details.customerEmail,
                phone: "555-555-5555",
                country: "US",
                region: "CA",
                address1: "123 Main St",
                city: "Beverly Hills",
                zip: "90210",
                ...details.shippingAddress
            }
        };
    }

    /**
     * Uploads an image URL to Printify Media Library to get an ID.
     */
    static async uploadImage(url: string): Promise<string | null> {
        try {
            console.log(`[Printify] Uploading image: ${url}`);
            const response = await fetch(`${this.API_BASE}/uploads/images.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.TOKEN}`
                },
                body: JSON.stringify({
                    url: url,
                    file_name: "upload_" + Date.now() + ".jpg" // Required field
                })
            });

            if (!response.ok) {
                console.error(`[Printify] Upload Failed: ${await response.text()}`);
                return null;
            }

            const data = await response.json();
            return data.id;
        } catch (e) {
            console.error('[Printify] Upload Error:', e);
            return null;
        }
    }

    /**
     * Generates a realistic mockup using the Printify API.
     * FLOW: Create Product -> Get Mockup Images -> Delete Product
     */
    static async generateMockupImage(imageUrl: string, productType: string): Promise<string | null> {
        if (!this.TOKEN || !this.SHOP_ID) {
            console.warn('[Printify] Missing API Token or Ship ID for mockup generation.');
            return null;
        }

        console.log(`[Printify] Raw productType from order: "${productType}"`);

        // 1. Normalize productType to match config keys
        // Convert "Luxury Spa Day Portrait - Canvas 11x14" -> "canvas-11x14"
        let normalizedType = productType.toLowerCase();

        // Extract product type from formatted strings
        if (normalizedType.includes('canvas')) {
            if (normalizedType.includes('16x20')) normalizedType = 'canvas-16x20';
            else normalizedType = 'canvas-11x14'; // default canvas size
        } else if (normalizedType.includes('mug')) {
            normalizedType = 'mug';
        } else if (normalizedType.includes('tumbler')) {
            normalizedType = 'tumbler';
        }

        console.log(`[Printify] Normalized productType: "${normalizedType}"`);

        // 2. Resolve Config
        let config = PRINTIFY_PRODUCT_MAP[normalizedType];

        if (!config || config.blueprint_id === 0) {
            console.warn(`[Printify] No valid config found for "${normalizedType}". Skipping mockup.`);
            return null;
        }

        console.log(`[Printify] Generating Mockup using Blueprint: ${config.blueprint_id}, Provider: ${config.print_provider_id}`);

        try {
            // STEP 0: Upload Image to get ID
            const imageId = await this.uploadImage(imageUrl);
            if (!imageId) throw new Error("Failed to upload image to Printify");

            // STEP A: Create Temporary Product
            const createPayload = {
                title: "Temp Mockup Product " + Date.now(),
                description: "Temporary product for mockup generation",
                blueprint_id: config.blueprint_id,
                print_provider_id: config.print_provider_id,
                variants: [
                    { id: config.variant_id, price: 1000, is_enabled: true }
                ],
                print_areas: [
                    {
                        variant_ids: [config.variant_id],
                        placeholders: [
                            {
                                position: "front",
                                images: [
                                    {
                                        id: imageId, // Use ID instead of src
                                        x: 0.5,
                                        y: 0.5,
                                        scale: 1,
                                        angle: 0
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            const createResp = await fetch(`${this.API_BASE}/shops/${this.SHOP_ID}/products.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.TOKEN}` },
                body: JSON.stringify(createPayload)
            });

            if (!createResp.ok) {
                const txt = await createResp.text();
                throw new Error(`Create Product Failed: ${txt}`);
            }

            const productData = await createResp.json();
            const productId = productData.id;
            console.log(`[Printify] Temp Product Created: ${productId}`);

            // STEP B: Retrieve Images (Wait a moment if needed, but usually immediate)
            // The Create response often contains images, but sometimes they are processing. 
            // Better to fetch specifics or check the response directly.
            // productData.images is an array.

            let mockupUrl = '';
            if (productData.images && productData.images.length > 0) {
                // Find a "preview" or standard view. usually the first one or one with is_default
                const defaultImg = productData.images.find((img: { is_default: boolean; src: string }) => img.is_default) || productData.images[0];
                mockupUrl = defaultImg.src;
            }

            // If still empty, try fetching product again after short delay?
            if (!mockupUrl) {
                console.log('[Printify] No images in create response, fetching product details...');
                const getResp = await fetch(`${this.API_BASE}/shops/${this.SHOP_ID}/products/${productId}.json`, {
                    headers: { 'Authorization': `Bearer ${this.TOKEN}` }
                });
                const getData = await getResp.json();
                if (getData.images && getData.images.length > 0) {
                    mockupUrl = getData.images[0].src;
                }
            }

            console.log(mockupUrl ? `[Printify] Found Mockup URL` : `[Printify] Failed to find mockup URL`);

            // STEP C: Delete Product
            await fetch(`${this.API_BASE}/shops/${this.SHOP_ID}/products/${productId}.json`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.TOKEN}` }
            });
            console.log(`[Printify] Temp Product Deleted`);

            return mockupUrl || null;

        } catch (e) {
            console.error('[Printify] Generate Mockup Failed:', e);
            return null;
        }
    }
}
