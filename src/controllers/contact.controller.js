import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    }
});

export const handleContactEnquiry = async (req, res) => {
    try {
        const { fullName, contactEmail, phone, serviceInterest, message } = req.body;

        if (!fullName || !contactEmail || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required fields.'
            });
        }

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c140e; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid rgba(130, 209, 43, 0.3);">
        <h2 style="color: #82d12b; margin-top: 0;">New ROINAX Corporate Inquiry</h2>
        <p style="font-size: 14px; color: #a4b2a8;">A new business consultation request was submitted from the portal.</p>
        <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;" />
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e4ebe7;">
          <tr>
            <td style="padding: 8px 0; color: #82d12b; width: 140px;"><strong>Client Name:</strong></td>
            <td style="padding: 8px 0;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #82d12b;"><strong>Work Email:</strong></td>
            <td style="padding: 8px 0;"><a href="mailto:${contactEmail}" style="color: #ffffff;">${contactEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #82d12b;"><strong>Phone / WhatsApp:</strong></td>
            <td style="padding: 8px 0;">${phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #82d12b;"><strong>Service Interest:</strong></td>
            <td style="padding: 8px 0;">${serviceInterest || 'General Inquiry'}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: 8px; border-left: 3px solid #82d12b;">
          <strong style="color: #82d12b; display: block; margin-bottom: 6px;">Message Scope:</strong>
          <p style="margin: 0; line-height: 1.6; color: #d4dad6; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="margin-top: 24px; font-size: 12px; color: #6e8275; text-align: center;">
          ROINAX Global Desk Notification System &bull; 2026
        </p>
      </div>
    `;

        await transporter.sendMail({
            from: `"ROINAX Global Inquiries" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || 'roinaxglobal@gmail.com',
            replyTo: contactEmail,
            subject: `[Lead Alert] ${serviceInterest || 'New Inquiry'} - ${fullName}`,
            html: htmlContent
        });

        return res.status(200).json({
            success: true,
            message: 'Your inquiry has been submitted. Our team will get back to you shortly.'
        });
    } catch (error) {
        console.error('Contact Inquiry Dispatch Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to send message right now. Please message directly on WhatsApp.'
        });
    }
};