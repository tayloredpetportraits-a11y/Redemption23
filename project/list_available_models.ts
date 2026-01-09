
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function listModels() {
    const key = process.env.GOOGLE_AI_API_KEY;
    console.log(`Checking models for Key: ${key?.substring(0, 10)}...`);

    if (!key) {
        console.error("No API Key found in .env.local");
        return;
    }

    // Unfortunately the Node SDK doesn't always expose listModels directly on the main client class in all versions easily.
    // We'll test 2 known standard models to see what happens.

    const modelsToTest = ["gemini-1.5-flash", "gemini-pro", "models/nano-banana-pro-preview"];

    for (const modelName of modelsToTest) {
        console.log(`\nTesting Model: ${modelName}`);
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test connection. Reply 'OK'.");
            const response = await result.response;
            console.log(`✅ SUCCESS! Model '${modelName}' is accessible.`);
        } catch (e: any) {
            console.log(`❌ FAILED. Model '${modelName}' error: ${e.message?.substring(0, 100)}...`);
        }
    }
}

listModels();
