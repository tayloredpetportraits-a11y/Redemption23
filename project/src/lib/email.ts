import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = 'Pet Portraits <onboarding@resend.dev>';

type NotificationType = 'ordered' | 'ready';

export async function sendCustomerNotification(
    customerEmail: string,
    customerName: string,
    orderId: string,
    type: NotificationType = 'ready',
    previewImageUrl?: string
) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY missing. Skipping email send.");
        return false;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const port = process.env.PORT || '3000';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${port}`);
    const galleryLink = `${baseUrl}/customer/gallery/${orderId}`;

    console.log(`[Email Service] Sending '${type}' notification to ${customerEmail}...`);

    let subject = 'Your Pet Portraits are Ready! 🐾';
    let htmlContent = '';

    if (type === 'ordered') {
        subject = 'We’ve started your Pet Portrait! 🎨';
        htmlContent = `
            <h1 style="color: #d97706;">We're on it!</h1>
            <p>Hi ${customerName},</p>
            <p>Thanks for your order! We've received your photos and our AI artists are hard at work creating your custom portraits.</p>
            <p>This usually takes 10-20 minutes. We'll send you another email as soon as they are ready for review.</p>
            <p style="margin-top: 20px;">Sit tight!</p>
        `;
    } else {
        // Ready
        htmlContent = `
          <h1 style="color: #d97706;">Your Portraits are Here!</h1>
          <p>Hi ${customerName},</p>
          <p>We've finished working on your pet's portraits and they look amazing!</p>
          ${previewImageUrl ? `<img src="${baseUrl}${previewImageUrl}" alt="Preview" style="width: 100%; max-width: 300px; border-radius: 8px; margin: 20px 0;" />` : ''}
          <p>Click the button below to view your gallery, unlock your favorites, and share with friends.</p>
          <a href="${galleryLink}" style="display: inline-block; background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">View My Gallery</a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            If the button doesn't work, copy this link:<br>
            <a href="${galleryLink}">${galleryLink}</a>
          </p>
        `;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: SENDER_EMAIL,
            to: [customerEmail],
            subject: subject,
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlContent}
        </div>
      `
        });

        if (error) {
            console.error('[Email Service] Error:', error);
            return false;
        }

        console.log('[Email Service] Email sent successfully:', data?.id);
        return true;
    } catch (e) {
        console.error('[Email Service] Exception:', e);
        return false;
    }
}
