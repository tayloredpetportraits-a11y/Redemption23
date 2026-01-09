const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testNano() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

    // Use the exact name from the list
    const model = genAI.getGenerativeModel({ model: "models/nano-banana-pro-preview" });

    try {
        // Find a template
        const templateDir = path.join(process.cwd(), 'public', 'templates', 'royalty');
        const templates = fs.readdirSync(templateDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
        if (templates.length === 0) throw new Error("No templates found");
        const templatePath = path.join(templateDir, templates[0]);

        // Find a pet
        const petDir = path.join(process.cwd(), 'public', 'uploads', 'pets');
        const pets = fs.readdirSync(petDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
        if (pets.length === 0) throw new Error("No pets found");
        const petPath = path.join(petDir, pets[0]);

        console.log(`Testing Nano Banana Pro Swap...`);
        console.log(`Template: ${templates[0]}`);
        console.log(`Pet: ${pets[0]}`);

        const templateBuf = fs.readFileSync(templatePath).toString('base64');
        const petBuf = fs.readFileSync(petPath).toString('base64');

        const prompt = "Switch the dog in the first image with the customer's dog in the second image. Maintain the exact style and composition of the first image.";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: templateBuf, mimeType: 'image/jpeg' } },
            { inlineData: { data: petBuf, mimeType: 'image/jpeg' } }
        ]);

        // Inspect response
        console.log("Response received.");
        console.log("Candidates:", result.response.candidates?.length);

        // Check for image parts
        const parts = result.response.candidates?.[0]?.content?.parts;
        if (parts) {
            parts.forEach((p, i) => {
                if (p.text) console.log(`Part ${i} [TEXT]:`, p.text);
                if (p.inlineData) console.log(`Part ${i} [IMAGE]: found mimeType ${p.inlineData.mimeType}`);
                if (p.executableCode) console.log(`Part ${i} [CODE]:`, p.executableCode);
            });
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response info:", JSON.stringify(e.response, null, 2));
        }
    }
}

testNano();
