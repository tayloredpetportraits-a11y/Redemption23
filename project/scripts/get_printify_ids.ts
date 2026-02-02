/**
 * Get Printify Product Type IDs
 * 
 * This script fetches Blueprint IDs for product TYPES (canvas, mug, etc.)
 * from the Printify API. These are templates - the actual portrait image
 * is passed separately when creating products/mockups.
 */

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

async function fetchPrintifyData(endpoint: string) {
    console.log(`[Printify] Fetching: ${endpoint}`);

    const response = await fetch(`${PRINTIFY_API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${PRINTIFY_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error(`Printify API Error: ${response.status} ${await response.text()}`);
    }

    return response.json();
}

async function main() {
    if (!PRINTIFY_TOKEN || !PRINTIFY_SHOP_ID) {
        console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID in .env.local');
        process.exit(1);
    }

    console.log('\n🔍 Fetching Printify Product Blueprints...\n');

    try {
        // Get catalog of available blueprints
        const catalog = await fetchPrintifyData('/catalog/blueprints.json');

        console.log(`✅ Found ${catalog.length} blueprints\n`);
        console.log('='.repeat(80));
        console.log('\n📦 RELEVANT PRODUCT TYPES:\n');

        // Filter for products we care about
        const relevantProducts = catalog.filter((bp: any) => {
            const title = bp.title.toLowerCase();
            return title.includes('canvas') ||
                title.includes('mug') ||
                title.includes('tumbler') ||
                title.includes('blanket');
        });

        for (const product of relevantProducts) {
            console.log(`\n${product.title}`);
            console.log(`  Blueprint ID: ${product.id}`);
            console.log(`  Brand: ${product.brand}`);
            console.log(`  Model: ${product.model}`);
            console.log(`  Description: ${product.description}`);

            // Get variants for this blueprint
            console.log(`\n  Fetching variants for Blueprint ${product.id}...`);
            const variants = await fetchPrintifyData(`/catalog/blueprints/${product.id}/print_providers.json`);

            if (variants.length > 0) {
                console.log(`  ✅ Print Providers:`);
                for (const provider of variants.slice(0, 3)) { // Show first 3 providers
                    console.log(`    - Provider ID: ${provider.id} (${provider.title})`);
                    if (provider.variants && provider.variants.length > 0) {
                        console.log(`      Variant ID: ${provider.variants[0].id} (${provider.variants[0].title})`);
                    }
                }
            }

            console.log('-'.repeat(80));
        }

        console.log('\n\n📝 NEXT STEPS:');
        console.log('Update src/lib/printify/config.ts with the Blueprint IDs and Provider/Variant IDs from above.');
        console.log('\nExample:');
        console.log(`  'canvas-11x14': {
    blueprint_id: <CANVAS_BLUEPRINT_ID>,
    print_provider_id: <PROVIDER_ID>,
    variant_id: <VARIANT_ID>
  }`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
