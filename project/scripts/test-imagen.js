const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testImagen() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

    // Try standard Imagen model name
    // Note: The SDK method for images is different, often via specific model request or REST
    // But let's try the generative-ai package's interface if it supports it.
    // Actually, standard google-generative-ai is mostly for text/multimodal (Gemini).
    // Image generation often requires REST calls to specifically "models/imagen-3.0-generate-001".

    try {
        console.log("Testing Imagen 4.0 Fast via REST...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${process.env.GOOGLE_AI_API_KEY}`;

        const payload = {
            instances: [
                { prompt: "A watercolor painting of a cute corgi astronaut" }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1" // or "1:1" depending on API spec
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Imagen API Error:", JSON.stringify(data.error, null, 2));
        } else if (data.predictions && data.predictions[0]) {
            console.log("Success! Received prediction.");
            // Usually data.predictions[0].bytesBase64Encoded or similar
            const firstPred = data.predictions[0];
            const keys = Object.keys(firstPred);
            console.log("Prediction keys:", keys);
            if (firstPred.bytesBase64Encoded) {
                console.log("Image Data Found (Base64 length):", firstPred.bytesBase64Encoded.length);
            }
        } else {
            console.log("Unexpected response format:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testImagen();
