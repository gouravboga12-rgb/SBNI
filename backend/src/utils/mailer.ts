import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || 'srinivaspolepalli10@gmail.com';
const SMTP_PASS = process.env.SMTP_PASSWORD || 'ardxrdyikzjopsod';
const SMTP_FROM = process.env.SMTP_FROM || `"JustPaisa" <${SMTP_USER}>`;

// Create reusable transporter object using SMTP transport
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed or relay certs
  },
});

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core send mail helper with error catching and detailed logging
 */
export async function sendEmail({ to, subject, html, text }: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });

    console.log(`[JustPaisa Mailer] Email dispatched successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[JustPaisa Mailer ERROR] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generates and sends OTP email for Sign Up / Account Verification
 */
export async function sendSignupOtpEmail({
  to,
  name,
  otpCode,
  role = 'VENDOR',
}: {
  to: string;
  name?: string;
  otpCode: string;
  role?: string;
}) {
  const isVendor = role === 'VENDOR';
  const roleLabel = isVendor ? 'Small Shop / Local Startup Business' : 'Business Money Financer (Lender)';
  const primaryColor = isVendor ? '#003893' : '#007a33';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JustPaisa Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">JustPaisa</h1>
              <p style="margin: 6px 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">Direct Business Financing Marketplace</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: ${isVendor ? '#eff6ff' : '#ecfdf5'}; border: 1px solid ${isVendor ? '#bfdbfe' : '#a7f3d0'}; border-radius: 9999px; font-size: 11px; font-weight: 700; color: ${primaryColor}; text-transform: uppercase; margin-bottom: 16px;">
                ${roleLabel} Registration
              </div>
              
              <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 700;">Verify Your Email Address</h2>
              <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                Hello <strong>${name || 'Business Partner'}</strong>,<br>
                Thank you for creating an account on <strong>JustPaisa</strong>. To complete your registration and activate your account, please enter the one-time verification code below:
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: #f1f5f9; border: 2px dashed ${primaryColor}; border-radius: 16px; padding: 24px 16px;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your 6-Digit One-Time Password (OTP)</span>
                    <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: ${primaryColor}; font-family: monospace; display: block; padding-left: 10px;">${otpCode}</span>
                    <span style="font-size: 12px; color: #e11d48; font-weight: 600; display: block; margin-top: 10px;">⏱ Valid for 10 minutes only</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #64748b; font-size: 13px; line-height: 1.5;">
                ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. JustPaisa team members will never ask for your password or OTP.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © 2026 JustPaisa. All rights reserved.<br>
                Need assistance? Contact us at <a href="mailto:srinivaspolepalli10@gmail.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">srinivaspolepalli10@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `🔐 ${otpCode} is your JustPaisa Sign Up Verification Code`,
    html,
  });
}

/**
 * Generates and sends OTP email for Password Reset / Forgot Password
 */
export async function sendForgotPasswordOtpEmail({
  to,
  name,
  otpCode,
  role = 'VENDOR',
}: {
  to: string;
  name?: string;
  otpCode: string;
  role?: string;
}) {
  const isVendor = role === 'VENDOR';
  const roleLabel = isVendor ? 'Small Shop / Local Startup Business' : 'Business Money Financer';
  const primaryColor = isVendor ? '#003893' : '#007a33';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JustPaisa Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">JustPaisa</h1>
              <p style="margin: 6px 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">Account Security Center</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #b91c1c; text-transform: uppercase; margin-bottom: 16px;">
                Password Reset Request • ${roleLabel}
              </div>
              
              <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 20px; font-weight: 700;">Reset Your JustPaisa Password</h2>
              <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                Hello <strong>${name || 'User'}</strong>,<br>
                We received a request to reset the password for your JustPaisa account (<strong>${to}</strong>). Use the one-time password (OTP) code below to proceed with setting a new password:
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 24px 16px;">
                    <span style="font-size: 12px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Your Password Reset OTP</span>
                    <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #be123c; font-family: monospace; display: block; padding-left: 10px;">${otpCode}</span>
                    <span style="font-size: 12px; color: #be123c; font-weight: 600; display: block; margin-top: 10px;">⏱ Code expires in 10 minutes</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © 2026 JustPaisa Security Operations.<br>
                For security inquiries: <a href="mailto:srinivaspolepalli10@gmail.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">srinivaspolepalli10@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `🔑 ${otpCode} is your JustPaisa Password Reset Code`,
    html,
  });
}

export interface SubscriptionInvoiceMailParams {
  to: string;
  userName?: string;
  businessName?: string;
  role?: string;
  planName: string;
  planDurationDays: number;
  amount: number;
  invoiceNumber: string;
  paymentId?: string;
  paymentMethod?: string;
  startDate: Date;
  endDate: Date;
  isAutoPay?: boolean;
}

/**
 * Generates and sends an official Tax / Subscription Invoice email to the purchasing user
 */
export async function sendSubscriptionInvoiceEmail({
  to,
  userName = 'Valued Partner',
  businessName,
  role = 'VENDOR',
  planName,
  planDurationDays,
  amount,
  invoiceNumber,
  paymentId = 'N/A',
  paymentMethod = 'Online Payment',
  startDate,
  endDate,
  isAutoPay = false,
}: SubscriptionInvoiceMailParams) {
  const isVendor = role === 'VENDOR';
  const roleLabel = isVendor ? 'Small Shop / Startup Business' : 'Business Money Financer';
  const primaryColor = isVendor ? '#003893' : '#007a33';
  const issueDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const startStr = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const endStr = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JustPaisa Tax Invoice - ${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="620" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%); padding: 32px 30px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">JustPaisa</h1>
                    <p style="margin: 4px 0 0; color: #93c5fd; font-size: 12px; font-weight: 500;">Financial Marketplace & Enterprise Network</p>
                  </td>
                  <td align="right">
                    <div style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 12px; padding: 8px 16px; text-align: right;">
                      <span style="display: block; color: #e2e8f0; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">TAX INVOICE</span>
                      <span style="display: block; color: #ffffff; font-size: 13px; font-weight: 800; font-family: monospace;">${invoiceNumber}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Success Alert Card -->
          <tr>
            <td style="padding: 24px 30px 0;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 14px 18px; color: #065f46; font-size: 13px; font-weight: 600;">
                🎉 <strong>Payment Successful & Access Unlocked!</strong> Your subscription for <strong>${planName}</strong> is now active until <strong>${endStr}</strong>.
              </div>
            </td>
          </tr>

          <!-- Billed Details -->
          <tr>
            <td style="padding: 24px 30px 12px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="55%" valign="top" style="padding-right: 15px;">
                    <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Billed To:</span>
                    <strong style="display: block; font-size: 14px; color: #0f172a;">${userName}</strong>
                    ${businessName ? `<span style="display: block; font-size: 12px; color: #475569; margin-top: 2px;">${businessName}</span>` : ''}
                    <span style="display: block; font-size: 12px; color: #475569; margin-top: 2px;">${to}</span>
                    <span style="display: inline-block; margin-top: 6px; padding: 2px 8px; background-color: #f1f5f9; border-radius: 6px; font-size: 11px; font-weight: 600; color: #475569;">${roleLabel}</span>
                  </td>
                  <td width="45%" valign="top" style="text-align: right;">
                    <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Invoice Info:</span>
                    <span style="display: block; font-size: 12px; color: #475569;">Date of Issue: <strong>${issueDateStr}</strong></span>
                    <span style="display: block; font-size: 12px; color: #475569; margin-top: 2px;">Payment Method: <strong>${paymentMethod}</strong></span>
                    <span style="display: block; font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px;">Ref: ${paymentId}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subscription Itemization Table -->
          <tr>
            <td style="padding: 12px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th align="left" style="padding: 12px 14px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Service Description</th>
                    <th align="center" style="padding: 12px 14px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Validity</th>
                    <th align="right" style="padding: 12px 14px; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 16px 14px; border-bottom: 1px solid #e2e8f0;">
                      <strong style="display: block; font-size: 13px; color: #0f172a;">${planName}</strong>
                      <span style="display: block; font-size: 11px; color: #64748b; margin-top: 3px;">
                        • Unlocked Direct Financer & Lender Contacts<br>
                        • Verified KYC Reports & WhatsApp Connect<br>
                        • Zero Middleman Commission Guarantee
                        ${isAutoPay ? '<br>• Auto-Renewal / AutoPay Active' : ''}
                      </span>
                    </td>
                    <td align="center" style="padding: 16px 14px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">
                      <strong>${planDurationDays} Days</strong><br>
                      <span style="font-size: 10px; color: #64748b;">${startStr} to ${endStr}</span>
                    </td>
                    <td align="right" style="padding: 16px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 800; color: #0f172a;">
                      ₹${amount}
                    </td>
                  </tr>
                  <tr style="background-color: #f8fafc;">
                    <td colspan="2" align="right" style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569;">Subtotal:</td>
                    <td align="right" style="padding: 12px 14px; font-size: 12px; font-weight: 700; color: #0f172a;">₹${amount}</td>
                  </tr>
                  <tr style="background-color: #f8fafc;">
                    <td colspan="2" align="right" style="padding: 6px 14px; font-size: 11px; font-weight: 600; color: #64748b;">GST (18% Included):</td>
                    <td align="right" style="padding: 6px 14px; font-size: 11px; font-weight: 600; color: #64748b;">₹${Math.round(amount * 0.18)}</td>
                  </tr>
                  <tr style="background-color: #eff6ff; border-top: 2px solid #bfdbfe;">
                    <td colspan="2" align="right" style="padding: 14px 14px; font-size: 13px; font-weight: 800; color: #1e3a8a;">Total Paid (INR):</td>
                    <td align="right" style="padding: 14px 14px; font-size: 16px; font-weight: 900; color: #1e3a8a;">₹${amount}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Contact & Support Info -->
          <tr>
            <td style="padding: 16px 30px 24px;">
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 14px 18px; font-size: 11px; color: #64748b; line-height: 1.6;">
                <strong>Need Help or Have Billing Questions?</strong><br>
                Contact our 24/7 FinTech Help Desk at <a href="mailto:srinivaspolepalli10@gmail.com" style="color: ${primaryColor}; font-weight: 700; text-decoration: none;">srinivaspolepalli10@gmail.com</a> or Toll Free <strong>+91 1800 123 4567</strong>.<br>
                JustPaisa App • BKC Financial Tower 4, Mumbai - 400051.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 30px; text-align: center; color: #94a3b8; font-size: 11px;">
              <p style="margin: 0 0 6px 0; color: #e2e8f0; font-weight: 600;">Thank you for your business with JustPaisa!</p>
              <p style="margin: 0;">This is an electronically generated tax invoice and does not require a physical signature.</p>
              <p style="margin: 6px 0 0; color: #64748b; font-size: 10px;">
                Developed by <a href="https://www.codtechitsolutions.com/" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 700;">CODTECH IT SOLUTIONS</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `🧾 Tax Invoice #${invoiceNumber} - JustPaisa Subscription (${planName})`,
    html,
  });
}

