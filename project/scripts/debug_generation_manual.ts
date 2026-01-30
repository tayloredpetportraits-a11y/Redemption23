
import { generateImagesForOrder } from '@/lib/ai/generation';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function debug() {
    console.log("🛠️ Starting Manual Generation Debug...");

    // Use the Order ID found in the previous run or a hardcoded one if needed
    // The previous run logs showed: 5eb793dc-4421-4594-b304-e3a4775f4c93
    // But better to just create a new dummy entry or fetch the latest one.

    // Let's hardcode the ID from the last test to retry it
    const orderId = '5eb793dc-4421-4594-b304-e3a4775f4c93';
    const petPhotoUrl = 'https://placedog.net/800/800?id=10';

    console.log(`Target Order: ${orderId}`);

    try {
        console.log("Calling generateImagesForOrder...");

        await generateImagesForOrder(
            orderId,
            petPhotoUrl,
            'royalty', // productType
            'Golden Retriever', // breed
            'Happy dog', // details
            false, // autoApprove
            'Buster' // petName
        );

        console.log("✅ Generation function completed without error!");
    } catch (e) {
        console.error("❌ Generation Failed:", e);
    }
}

debug();
