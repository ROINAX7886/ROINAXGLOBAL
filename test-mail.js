import 'dotenv/config';
import { sendMail } from './src/lib/mailer.js';

async function test() {
  try {
    console.log('Testing Gmail API with user:', process.env.GMAIL_USER);
    const result = await sendMail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: 'Test Diagnostic Email',
      html: '<h1>Gmail API is connected successfully!</h1>',
    });
    console.log('Success! API Response:', result);
  } catch (err) {
    console.error('Diagnostic Error:', err?.response?.data || err);
  }
}

test();