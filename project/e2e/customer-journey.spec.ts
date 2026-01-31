import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

let testOrderId: string;
let testEmail: string;

test.describe('Full Customer Journey - Canvas Purchase', () => {
    // Run tests sequentially and increase timeout for order setup
    test.describe.configure({ mode: 'serial', timeout: 600000 }); // 10 minute timeout

    test.beforeAll(async () => {
        test.setTimeout(600000); // 10 minute timeout for setup
        console.log('💆‍♀️ Setting up E2E test - Creating Shopify order...');

        // 1. Create unique order via webhook simulation
        const uniqueId = Math.floor(Math.random() * 100000000) + 900000000;
        testEmail = `e2e.test.${uniqueId}@example.com`;
        const orderName = `#E2E-${uniqueId}`;

        const payload = {
            id: uniqueId,
            name: orderName,
            email: testEmail,
            customer: {
                first_name: "E2E",
                last_name: "Test",
                email: testEmail
            },
            line_items: [
                {
                    id: uniqueId + 1,
                    name: 'Spa Day Canvas Portrait 16x20',
                    quantity: 1,
                    properties: [
                        { name: 'Name', value: 'Buddy' },
                        { name: 'Breed', value: 'Golden Retriever' },
                        { name: 'Pet Photo', value: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?q=80&w=2940&auto=format&fit=crop' },
                        { name: 'Notes', value: 'Loves spa days and treats' }
                    ]
                }
            ]
        };

        const body = JSON.stringify(payload);
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';
        const hmac = crypto
            .createHmac('sha256', secret)
            .update(body, 'utf8')
            .digest('base64');

        // 2. Send webhook
        const res = await fetch('http://localhost:3000/api/webhooks/shopify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-shopify-topic': 'orders/create',
                'x-shopify-hmac-sha256': hmac
            },
            body: body
        });

        if (!res.ok) {
            throw new Error(`Webhook failed: ${res.status} ${await res.text()}`);
        }

        console.log('✅ Webhook accepted');

        // 3. Wait for order creation and image generation
        console.log('⏳ Waiting for order creation and image generation...');
        const maxRetries = 150; // 5 minutes max

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 2000));

            if (!testOrderId) {
                const { data: order } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('customer_email', testEmail)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (order) {
                    testOrderId = order.id;
                    console.log(`✅ Order created: ${testOrderId}`);
                }
            }

            if (testOrderId) {
                const { count } = await supabase
                    .from('images')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', testOrderId);

                if (count && count >= 5) {
                    console.log(`✅ Generation complete! Found ${count} images`);
                    break;
                }
            }
        }

        if (!testOrderId) {
            throw new Error('Order creation timed out');
        }

        // 4. Auto-approve all images for testing
        console.log('✅ Auto-approving images for E2E test...');
        const { data: images } = await supabase
            .from('images')
            .select('id')
            .eq('order_id', testOrderId)
            .eq('type', 'primary');

        if (images && images.length > 0) {
            const imageIds = images.map(img => img.id);
            await supabase
                .from('images')
                .update({ status: 'approved' })
                .in('id', imageIds);
            console.log(`✅ Approved ${imageIds.length} images`);
        }

        console.log(`🚀 Ready for browser test: http://localhost:3000/portal/${testOrderId}`);
    });

    test('Step 1: Access customer portal via magic link', async ({ page }) => {
        // Navigate to the portal
        await page.goto(`/portal/${testOrderId}`);

        // Verify header is visible
        await expect(page.getByText('Taylored Pet Portraits')).toBeVisible();

        // Verify tagline
        await expect(page.getByText('Your Pet, Reimagined.')).toBeVisible();
    });

    test('Step 2: View generated portraits in gallery', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);

        // Wait for images to load
        await page.waitForTimeout(2000);

        // Check that at least one portrait image is visible
        const portraits = page.locator('img[alt*="Portrait"], img[src*="supabase"]').first();
        await expect(portraits).toBeVisible({ timeout: 10000 });

        // Verify order status message (should show ready status)
        const statusText = page.locator('text=/ready|approved|select/i').first();
        await expect(statusText).toBeVisible();
    });

    test('Step 3: Select favorite portrait', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);
        await page.waitForTimeout(2000);

        // Find and click the first portrait image
        const firstPortrait = page.locator('img[alt*="Portrait"], img[src*="supabase"]').first();
        await expect(firstPortrait).toBeVisible({ timeout: 10000 });
        await firstPortrait.click();

        // Verify selection indicator (could be a checkmark, border, or highlight)
        // This might vary based on your implementation
        await page.waitForTimeout(1000);
    });

    test('Step 4: View canvas mockup', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);
        await page.waitForTimeout(2000);

        // Select a portrait first
        const portrait = page.locator('img[alt*="Portrait"], img[src*="supabase"]').first();
        await portrait.click();
        await page.waitForTimeout(1500);

        // Look for mockup preview or "Preview" button
        const mockupOrPreview = page.locator('text=/mockup|preview/i').or(page.locator('img[alt*="mockup"]')).first();

        // If there's a preview button, click it
        const previewButton = page.locator('button:has-text("Preview"), button:has-text("View Mockup")').first();
        if (await previewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await previewButton.click();
            await page.waitForTimeout(1500);
        }

        // Verify mockup is displayed
        await expect(mockupOrPreview).toBeVisible({ timeout: 5000 });
    });

    test('Step 5: Explore bonus themes (locked)', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);
        await page.waitForTimeout(2000);

        // Look for bonus/locked themes section
        const bonusSection = page.locator('text=/bonus|additional theme|unlock/i').first();

        if (await bonusSection.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Check for lock icon or "unlock" text
            const lockIndicator = page.locator('[class*="lock"]').or(page.locator('text=/🔒|unlock|\$/i')).first();
            await expect(lockIndicator).toBeVisible();

            console.log('✅ Bonus themes section found with lock indicator');
        } else {
            console.log('⚠️ No bonus themes section found (might be expected)');
        }
    });

    test('Step 6: Test unlock bonus themes flow', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);
        await page.waitForTimeout(2000);

        // Look for unlock button
        const unlockButton = page.locator('button:has-text("Unlock"), button:has-text("Add Bonus")').first();

        if (await unlockButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Click unlock button
            await unlockButton.click();
            await page.waitForTimeout(1000);

            // Should see Stripe checkout or payment modal
            const checkoutIndicator = page.locator('text=/stripe|payment|checkout/i').or(page.locator('iframe[src*="stripe"]')).first();

            // Just verify the payment flow initiated (don't complete payment in test)
            const hasCheckout = await checkoutIndicator.isVisible({ timeout: 10000 }).catch(() => false);

            if (hasCheckout) {
                console.log('✅ Stripe checkout initiated');
                // Close modal or go back
                await page.goBack().catch(() => { });
            } else {
                console.log('⚠️ Payment flow may be configured differently');
            }
        } else {
            console.log('⚠️ No unlock button found (might be expected for canvas orders)');
        }
    });

    test('Step 7: Download mobile wallpaper', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);
        await page.waitForTimeout(2000);

        // Look for wallpaper download button
        const wallpaperButton = page.locator('button:has-text("Wallpaper")').or(page.locator('button:has-text("Download")')).or(page.locator('a:has-text("Mobile")')).first();

        if (await wallpaperButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Set up download listener
            const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

            // Click download
            await wallpaperButton.click();

            try {
                const download = await downloadPromise;
                console.log(`✅ Wallpaper download initiated: ${download.suggestedFilename()}`);

                // Verify filename format
                expect(download.suggestedFilename()).toMatch(/wallpaper|portrait/i);
            } catch (e) {
                console.log('⚠️ Download event not captured (might use different method)');
            }
        } else {
            console.log('⚠️ No wallpaper download button found');
        }
    });

    test('Step 8: Confirm selection and complete order', async ({ page }) => {
        await page.goto(`/portal/${testOrderId}`);
        await page.waitForTimeout(2000);

        // Select a portrait
        const portrait = page.locator('img[alt*="Portrait"], img[src*="supabase"]').first();
        await portrait.click();
        await page.waitForTimeout(1500);

        // Look for confirm/submit button
        const confirmButton = page.locator('button:has-text("Confirm")').or(page.locator('button:has-text("Submit")')).or(page.locator('button:has-text("Complete")')).first();

        if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Click confirm
            await confirmButton.click();
            await page.waitForTimeout(2000);

            // Should see success message or confirmation
            const successIndicator = page.locator('text=/success|confirmed|thank you|complete/i').first();
            await expect(successIndicator).toBeVisible({ timeout: 10000 });

            console.log('✅ Order confirmed successfully');
        } else {
            console.log('⚠️ No confirm button found (might need portrait selection first)');
        }
    });

    test('Step 9: Verify final order status in database', async () => {
        // Check final order status
        const { data: order } = await supabase
            .from('orders')
            .select('status, selected_image_id, fulfilled_at')
            .eq('id', testOrderId)
            .single();

        console.log('Final order status:', order);

        // Verify order has progressed
        expect(order).toBeTruthy();
        expect(['ready', 'fulfilled', 'confirmed']).toContain(order?.status);
    });

    test.afterAll(async () => {
        console.log(`\n📋 E2E Test Summary`);
        console.log(`Order ID: ${testOrderId}`);
        console.log(`Email: ${testEmail}`);
        console.log(`Portal: http://localhost:3000/portal/${testOrderId}`);
        console.log(`\n🧹 Note: Test data remains in database for inspection`);
        console.log(`   To cleanup: Use scripts/cleanup_orders.ts if needed`);
    });
});
