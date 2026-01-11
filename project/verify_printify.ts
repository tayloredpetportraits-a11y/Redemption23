
// import { generateProductMockup } from './src/lib/ai/generation';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: '.env.local' });

async function verifyPrintify() {
    console.log('Verifying Printify Integration...');

    const token = process.env.PRINTIFY_API_TOKEN;
    if (!token) {
        console.error('Missing PRINTIFY_API_TOKEN');
        return;
    }

    // 1. Fetch Variants for Blueprint 1159 (User Requested: Matte Canvas, Stretched, 1.25)
    const blueprintId = 1159;
    console.log(`Fetching Variants for Blueprint ${blueprintId}...`);
    try {
        // Correction: Let's fetch print providers for 555 first.
        const ppRes = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers.json`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!ppRes.ok) {
            console.error('Failed to fetch providers:', await ppRes.text());
        } else {
            const providers = await ppRes.json();
            console.log(`Found ${providers.length} providers for Canvas.`);
            // Log all providers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            providers.forEach((p: any) => {
                console.log(`[Provider] ID: ${p.id} | Title: ${p.title}`);
            });

            // Pick first US provider or generic
            const provider = providers[0];
            console.log(`Using Provider: ${provider.title} (ID: ${provider.id})`);

            const vRes = await fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${provider.id}/variants.json`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!vRes.ok) {
                console.error('Failed to fetch variants:', await vRes.text());
            } else {
                const variants = await vRes.json();
                console.log(`Found ${variants.variants.length} variants.`);

                // Log all to check availability
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                variants.variants.forEach((v: any) => {
                    console.log(`[Variant] ID: ${v.id} | Title: ${v.title}`);
                });
            }
        }

    } catch (e) {
        console.error('Error fetching variants:', e);
    }

    // 2. (Optional) Test Generation if we have a valid ID
    // We can skip actual generation for now until we have the ID to put in config.
}

verifyPrintify();
