
import { PrintifyService } from '@/lib/printify/service';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const imageUrl = 'https://opxgicxdrbpgpsxonogk.supabase.co/storage/v1/object/public/primary-images/generated/e980100e-f745-4bb9-b877-148030c1c74b/portrait_primary_0.png'; // Use a real existing URL
    const productType = 'canvas-11x14';

    console.log(`Testing Multi-View Generation for ${productType}...`);
    const results = await PrintifyService.generateAllMockups(imageUrl, productType);

    console.log(`Found ${results.length} mockups:`);
    results.forEach(r => {
        console.log(`- ${r.label} (Default: ${r.is_default}): ${r.src}`);
    });
}

main();
