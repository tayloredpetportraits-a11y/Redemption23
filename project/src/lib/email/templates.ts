/**
 * Email Templates for Token Distribution
 * 
 * Uses Resend to send branded emails with access tokens
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Taylored Pet Portraits <noreply@tayloredpetportraits.com>';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://redemption.tayloredpetportraits.com';

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send email when portraits are ready with access token
 */
export async function sendOrderReadyEmail(
    orderId: string,
    customerEmail: string,
    customerName: string,
    accessToken: string
): Promise<EmailResult> {
    const accessUrl = `${BASE_URL}/order/${accessToken}`;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: customerEmail,
            subject: '🎨 Your Taylored Pet Portraits are Ready!',
            html: getOrderReadyTemplate(customerName, accessUrl),
        });

        if (error) {
            console.error('Failed to send order ready email:', error);
            return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
    } catch (error) {
        console.error('Failed to send order ready email:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Send email with new access link when customer requests renewal
 */
export async function sendNewLinkEmail(
    orderId: string,
    customerEmail: string,
    customerName: string,
    accessToken: string
): Promise<EmailResult> {
    const accessUrl = `${BASE_URL}/order/${accessToken}`;

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: customerEmail,
            subject: '🔗 Your New Taylored Pet Portraits Link',
            html: getNewLinkTemplate(customerName, accessUrl),
        });

        if (error) {
            console.error('Failed to send new link email:', error);
            return { success: false, error: error.message };
        }

        return { success: true, messageId: data?.id };
    } catch (error) {
        console.error('Failed to send new link email:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * HTML template for "Your Portraits Are Ready" email
 */
function getOrderReadyTemplate(customerName: string, accessUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Portraits Are Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎨 Your Portraits Are Ready!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Hi <strong>${customerName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Great news! Your custom pet portraits are ready to view and download. 🐾
              </p>
              
              <p style="margin: 0 0 30px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Click the button below to see your beautiful portraits:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${accessUrl}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                      View My Portraits
                    </a>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      📅 <strong>Link Validity:</strong> This link will remain active for 90 days
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                      💾 <strong>Download Tip:</strong> Save your high-resolution files to your device
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Love what you see? Share your pet's glow-up on social media and tag us <strong>@tayloredpetportraits</strong>! ✨
              </p>
              
              <p style="margin: 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Questions? Just reply to this email.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #111827; font-size: 16px; line-height: 1.6;">
                – Tay<br>
                <span style="color: #6b7280; font-size: 14px;">Taylored Pet Portraits</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Taylored Pet Portraits. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * HTML template for "New Access Link" email
 */
function getNewLinkTemplate(customerName: string, accessUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your New Access Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🔗 Your New Access Link</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Hi <strong>${customerName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                As requested, here's a fresh link to access your pet portraits:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${accessUrl}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                      Access My Portraits
                    </a>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 0 0 30px 0; border-left: 4px solid #f59e0b;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      ⏰ <strong>Important:</strong> This new link will remain active for 90 days from today. Make sure to download all your files before it expires!
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #111827; font-size: 16px; line-height: 1.6;">
                If you didn't request this link, please contact us immediately.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #111827; font-size: 16px; line-height: 1.6;">
                – Tay<br>
                <span style="color: #6b7280; font-size: 14px;">Taylored Pet Portraits</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} Taylored Pet Portraits. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
