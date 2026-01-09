
import { generateSocialCaption } from './src/lib/marketing/generator';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Testing Social Caption Generation...");
    const result = await generateSocialCaption(
        "Bark Twain",
        "Golden Retriever",
        "Royal King Portrait",
        "He loves tennis balls and swimming"
    );
    console.log("Result:", JSON.stringify(result, null, 2));
}

test();
