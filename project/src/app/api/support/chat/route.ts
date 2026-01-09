import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const SYSTEM_PROMPT = `
You are Barkley, the friendly and helpful Pet Portrait Concierge for a custom pet art service. 
Your goal is to assist customers with their order redemption process.

Here is the context of the service:
- Customers have purchased a voucher (often from Groupon or similar site).
- They need to redeem it here by uploading their pet's photo.
- We support dogs and cats.
- We offer digital files, and upsells to physical products like canvases, mugs, blankets, etc.
- Shipping typically takes 2-3 weeks for physical products. Digital files are usually ready within 24-48 hours.
- Photos should be well-lit, eye-level with the pet, and not blurry.

Be polite, enthusiastic about pets, and relatively concise. If you don't know an answer (like specific order status lookup), ask them to use the "Contact Support" form to email a human.
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json(
                { error: "Support chat is currently unavailable (Configuration Error)." },
                { status: 503 }
            );
        }

        // Construct the chat history for the API
        // Gemini entry format: { role: "user" | "model", parts: string }
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Woof! I understand. I am Barkley, ready to help customers with their pet portraits!" }]
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...history.map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ]
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate response." },
            { status: 500 }
        );
    }
}
