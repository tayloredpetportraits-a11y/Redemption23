
import { PrintifyService } from '@/lib/printify/service';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyMultiView() {
    console.log('Verifying Multi-View Mockup Generation...');

    // Use a known public image from previous steps or placeholder
    // This needs to be a valid URL.
    const imageUrl = 'https://opxgicxdrbpgpsxonogk.supabase.co/storage/v1/object/public/primary-images/temp/temp_printify_1768074611364.png';

    const mockups = await PrintifyService.generateAllMockups(imageUrl, 'canvas-11x14');

    console.log(`\nReturned ${mockups.length} mockups.`);
    mockups.forEach((m, i) => {
        console.log(`[${i}] Label: ${m.label} | IsDefault: ${m.is_default}`);
        console.log(`    Src: ${m.src}`);
    });

    if (mockups.length >= 3) {
        console.log('\nSUCCESS: Retrieved multiple views (Front, Side, Context).');
    } else {
        console.error('\nFAILURE: Did not get multiple views.');
    }
}

verifyMultiView();
