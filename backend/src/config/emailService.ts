import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'dakshinamurthydialyfinance@gmail.com',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
  const fromName = 'Dakshinamurthy Daily Finance';
  const fromEmail = process.env.SMTP_USER || 'dakshinamurthydialyfinance@gmail.com';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email.trim(),
    subject: 'Verification Code for Registration - Dakshinamurthy Daily Finance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ffc800;">
          <h2 style="color: #111827; margin: 0; font-size: 20px; letter-spacing: 2px;">DAKSHINAMURTHY</h2>
          <p style="color: #10b981; margin: 2px 0 0 0; font-size: 11px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">Daily Finance</p>
        </div>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello,</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Thank you for choosing Dakshinamurthy Daily Finance. To complete your new customer registration, please use the following one-time password (OTP):</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #111827; background-color: #fef3c7; padding: 12px 30px; border-radius: 8px; border: 1px solid #fde68a; display: inline-block;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #ef4444; font-size: 12px; line-height: 1.5; font-weight: 500;">
          ⚠️ This verification code is valid for 5 minutes and should not be shared with anyone.
        </p>
        
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.6;">
          <p style="margin: 0;">This is an automated security message. Please do not reply directly to this email.</p>
          <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} Dakshinamurthy Daily Finance. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};
