const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function debugNano() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/nano-banana-pro-preview" });

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'royalty', 'cat_king_robed_on_throne.png');
    const petPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'pet-1767935236565-uploaded_image_1767935216272.jpg');

    const templateBuf = fs.readFileSync(templatePath).toString('base64');
    const petBuf = fs.readFileSync(petPath).toString('base64');

    const basicPrompt = "Swap the subject from the second image into the first image.";

    // Case 1: Template First
    console.log("Testing Case 1: [Prompt, Template, Pet]");
    try {
        const result1 = await model.generateContent([
            "Case 1: Swap the main subject from Image 2 (Dog) into Image 1 (King Cat). Replace the Cat face with the Dog face.",
            { inlineData: { data: templateBuf, mimeType: 'image/png' } },
            { inlineData: { data: petBuf, mimeType: 'image/jpeg' } }
        ]);
        const buf1 = Buffer.from(result1.response.candidates[0].content.parts[0].inlineData.data, 'base64');
        fs.writeFileSync('debug_case_1.png', buf1);
        console.log("Saved debug_case_1.png");
    } catch (e) { console.error("Case 1 failed", e.message); }

    // Case 2: Pet First
    console.log("Testing Case 2: [Prompt, Pet, Template]");
    try {
        const result2 = await model.generateContent([
            "Case 2: Use Image 1 as the Face Reference. Use Image 2 as the Base Template. Put the Face from Image 1 onto the Body in Image 2.",
            { inlineData: { data: petBuf, mimeType: 'image/jpeg' } },
            { inlineData: { data: templateBuf, mimeType: 'image/png' } }
        ]);
        const buf2 = Buffer.from(result2.response.candidates[0].content.parts[0].inlineData.data, 'base64');
        fs.writeFileSync('debug_case_2.png', buf2);
        console.log("Saved debug_case_2.png");
    } catch (e) { console.error("Case 2 failed", e.message); }

}

debugNano();
