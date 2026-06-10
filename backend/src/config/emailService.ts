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

export const sendDuesReminderEmail = async (
  email: string,
  customerName: string,
  dueAmount: number,
  overdueCount: number,
  remainingBalance: number
): Promise<boolean> => {
  const fromName = 'Dakshinamurthy Daily Finance';
  const fromEmail = process.env.SMTP_USER || 'dakshinamurthydialyfinance@gmail.com';

  const isOverdue = overdueCount > 0;
  const subject = isOverdue
    ? `🚨 URGENT: Overdue Loan Installment Reminder - Dakshinamurthy Daily Finance`
    : `📅 Daily Loan Installment Reminder - Dakshinamurthy Daily Finance`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px solid #ffc800;">
        <h2 style="color: #111827; margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: 800;">DAKSHINAMURTHY</h2>
        <p style="color: #10b981; margin: 4px 0 0 0; font-size: 12px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">Daily Finance</p>
      </div>
      
      <p style="color: #1f2937; font-size: 15px; line-height: 1.5; font-weight: 600;">Dear ${customerName},</p>
      
      ${isOverdue 
        ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: bold; line-height: 1.5;">🚨 ACTION REQUIRED: OVERDUE INSTALMENTS</p>
          <p style="margin: 4px 0 0 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">You have missed <strong>${overdueCount}</strong> daily installment(s). Your lending profile score is at risk of deactivation. Please pay immediately!</p>
        </div>
        `
        : `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold; line-height: 1.5;">📅 DAILY INSTALLMENT DUE TODAY</p>
          <p style="margin: 4px 0 0 0; color: #78350f; font-size: 13px; line-height: 1.5;">This is a friendly reminder that your daily installment is due today. Settle today to keep your score healthy!</p>
        </div>
        `
      }

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px 16px; color: #4b5563; font-size: 14px; border: 1px solid #e5e7eb;"><strong>Installment Amount</strong></td>
          <td style="padding: 12px 16px; color: #111827; font-size: 16px; font-weight: bold; text-align: right; border: 1px solid #e5e7eb;">₹${dueAmount.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #4b5563; font-size: 14px; border: 1px solid #e5e7eb;"><strong>Status</strong></td>
          <td style="padding: 12px 16px; color: ${isOverdue ? '#ef4444' : '#f59e0b'}; font-size: 14px; font-weight: bold; text-align: right; border: 1px solid #e5e7eb;">
            ${isOverdue ? `Overdue (${overdueCount} unpaid)` : 'Due Today'}
          </td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px 16px; color: #4b5563; font-size: 14px; border: 1px solid #e5e7eb;"><strong>Outstanding Balance</strong></td>
          <td style="padding: 12px 16px; color: #111827; font-size: 14px; text-align: right; border: 1px solid #e5e7eb;">₹${remainingBalance.toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #bbf7d0;">
        <p style="margin: 0; color: #166534; font-size: 14px; font-weight: bold;">How to pay?</p>
        <p style="margin: 6px 0 0 0; color: #14532d; font-size: 13px; line-height: 1.5;">
          Open the <strong>Dakshinamurthy Daily Finance</strong> app on your mobile, tap <strong>"Pay Installment"</strong>, scan the UPI QR code, and submit your payment screenshot.
        </p>
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.6;">
        <p style="margin: 0;">This is an automated system reminder. Please contact support via WhatsApp if you have any questions.</p>
        <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} Dakshinamurthy Daily Finance. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email.trim(),
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
};
