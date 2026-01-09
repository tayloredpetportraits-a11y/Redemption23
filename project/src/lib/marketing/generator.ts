
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
// Ideally, we pass the image to get the best caption. So let's use gemini-1.5-flash or pro-vision if available.
// The other file used "models/nano-banana-pro-preview" which is likely a tuned model. 
// For captions, standard gemini-1.5-flash is great.

export async function generateSocialCaption(
    petName: string,
    petBreed: string,
    productType: string,
    extraDetails: string = ''
): Promise<{ caption: string; hashtags: string[] }> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You remain in the persona of a professional social media manager for "Taylored Pet Portraits", a brand that turns pets into royalty, astronauts, and more.
        
        Task: Write an engaging Instagram caption for a new customer portrait.
        
        Details:
        - Pet Name: ${petName}
        - Breed: ${petBreed || 'Adorable Pet'}
        - Theme/Product: ${productType}
        - Extra Details: ${extraDetails}
        
        Requirements:
        1. Tone: Fun, celebratory, slightly humorous, and premium.
        2. Format: Returns a JSON object with 'caption' (string) and 'hashtags' (string[]).
        3. Caption: 1-2 sentences. Use emojis. Encourage people to get their own at the link in bio.
        4. Hashtags: 10-15 relevant tags mixed with high volume (e.g. #dogsofinstagram) and niche (e.g. #custompetportrait).
        
        Output JSON only.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Basic JSON cleanup
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        return {
            caption: data.caption || `All hail King ${petName}! 👑 Another masterpiece by Taylored Pet Portraits.`,
            hashtags: data.hashtags || ['#petportraits', '#dogsofinstagram']
        };

    } catch (error) {
        console.error("AI Caption Generation Failed:", error);
        // Fallback
        return {
            caption: `${petName} is looking majestic! 🐾 Get your own custom pet portrait today!`,
            hashtags: ['#petportraits', '#customart', `#${petBreed.replace(/\s/g, '')}`]
        };
    }
}
