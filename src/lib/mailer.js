import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Must be 16-character App Password, NOT your Gmail password
    },
});

export const sendOtpEmail = async (email, otpCode, purpose = 'Verification') => {
    const mailOptions = {
        from: process.env.SMTP_FROM || `"ROINAX Global" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `ROINAX Global - ${purpose} Code`,
        html: `
      <div style="font-family: Arial, sans-serif; background: #0d160f; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 480px; margin: auto; border: 1px solid rgba(130, 209, 43, 0.35);">
        <h2 style="color: #82d12b; margin-top: 0; font-size: 22px;">ROINAX Global</h2>
        <p style="color: #d1ded5; font-size: 14px;">Your one-time security code for <strong>${purpose}</strong> is:</p>
        <div style="background: #142217; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #82d12b; margin: 24px 0; border: 1px solid #2f7d16;">
          ${otpCode}
        </div>
        <p style="color: #7d8c82; font-size: 12px; line-height: 1.5;">This code expires in 10 minutes. If you did not request this, please disregard this email.</p>
      </div>
    `,
    };

    return transporter.sendMail(mailOptions);
};