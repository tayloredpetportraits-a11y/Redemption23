/**
 * Get specific variant IDs for key products
 */

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;

async function getVariantIDs(blueprintId: number, productName: string) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 ${productName} (Blueprint ${blueprintId})`);
    console.log('='.repeat(80));

    const response = await fetch(`${PRINTIFY_API_BASE}/catalog/blueprints/${blueprintId}/print_providers.json`, {
        headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` }
    });

    const providers = await response.json();

    for (const provider of providers.slice(0, 1)) { // Use first provider
        console.log(`\n✅ Using Provider: ${provider.title} (ID: ${provider.id})`);

        if (provider.variants && provider.variants.length > 0) {
            console.log(`\nAvailable Variants:`);
            provider.variants.slice(0, 5).forEach((v: any) => {
                console.log(`  - ${v.title}: Variant ID ${v.id}`);
            });

            console.log(`\n📝 CONFIG:`);
            console.log(`{`);
            console.log(`  blueprint_id: ${blueprintId}, // ${productName}`);
            console.log(`  print_provider_id: ${provider.id}, // ${provider.title}`);
            console.log(`  variant_id: ${provider.variants[0].id} // ${provider.variants[0].title}`);
            console.log(`}`);
        }
    }
}

async function main() {
    await getVariantIDs(1061, 'Classic Canvas');
    await getVariantIDs(478, 'Ceramic Mug (11oz, 15oz)');
    await getVariantIDs(1662, 'Tundra Tumbler 30oz');
}

main();
