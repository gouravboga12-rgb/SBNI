import dotenv from 'dotenv';
dotenv.config();

import { sendSignupOtpEmail } from '../src/utils/mailer';

async function main() {
  const testRecipient = process.argv[2] || process.env.SMTP_USER || 'srinivaspolepalli10@gmail.com';
  console.log(`[Test Mailer] Sending test OTP verification email to: ${testRecipient}...`);

  const result = await sendSignupOtpEmail({
    to: testRecipient,
    name: 'Test Partner',
    otpCode: '582910',
    role: 'VENDOR',
  });

  if (result.success) {
    console.log(`[Test Mailer] SUCCESS! Message dispatched. Message ID: ${result.messageId}`);
    console.log('[Test Mailer] Check your inbox/spam folder to verify the new subject and layout.');
  } else {
    console.error(`[Test Mailer] FAILED! Error: ${result.error}`);
  }
}

main();
