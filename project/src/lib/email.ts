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
        subject = 'We\'ve started your Pet Portrait! 🎨';
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

/**
 * Send processing email notification
 * Triggered immediately when order is received via Shopify webhook
 */
export async function sendProcessingEmail(
    customerEmail: string,
    customerName: string,
    petName: string
): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY missing. Skipping processing email send.");
        return false;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log(`[Email Service] Sending processing notification to ${customerEmail} for pet: ${petName}...`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'Pet Portraits <noreply@tayloredsolutions.ai>',
            to: [customerEmail],
            subject: `🐾 We're Creating ${petName}'s Portrait!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #7C3AED; margin-bottom: 20px;">Paw-some news, ${customerName}!</h1>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #333;">
                        We've received your order for <strong>${petName}</strong>.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.6; color: #333;">
                        Our AI artists are starting work on your portrait right now. 🎨
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); padding: 20px; border-radius: 8px; margin: 30px 0; color: white;">
                        <p style="margin: 0; font-size: 14px;">
                            ✨ Estimated completion: <strong>15-30 minutes</strong>
                        </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        You'll receive another email when your portraits are ready to view. 
                        We can't wait to show you the results!
                    </p>
                    
                    <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                        Questions? Reply to this email and we'll help!<br />
                        Pet Portraits by Taylored Solutions
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('[Email Service] Processing email error:', error);
            return false;
        }

        console.log('[Email Service] Processing email sent successfully:', data?.id);
        return true;
    } catch (e) {
        console.error('[Email Service] Processing email exception:', e);
        return false;
    }
}

