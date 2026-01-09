import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { name, email, message, subject } = await request.json();

        if (!process.env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is missing");
            return NextResponse.json(
                { error: 'Support email configuration missing.' },
                { status: 503 }
            );
        }

        // You might want to pull the destination email from env as well
        const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'onboarding@resend.dev';

        const data = await resend.emails.send({
            from: 'Pet Portrait Support <support@resend.dev>', // Update this with your verified domain if available
            to: [SUPPORT_EMAIL],
            replyTo: email, // Set the user's email as reply-to so you can answer them easily
            subject: `[Support Request] ${subject || 'New Message'} from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json(
            { error: 'Failed to send email.' },
            { status: 500 }
        );
    }
}
