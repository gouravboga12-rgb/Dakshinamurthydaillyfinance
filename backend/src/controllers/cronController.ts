import { Request, Response } from 'express';
import { db } from '../config/db';
import { sendDuesReminderEmail } from '../config/emailService';

export const sendCronReminders = async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET || 'dakshinamurthy_cron_secret_123';
  const requestKey = req.query.key || req.headers['x-cron-key'];

  if (requestKey !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    // 1. Fetch all active loans
    const activeLoans = await db.getLoans({ status: 'Active' });
    let emailsSent = 0;
    const todayStr = db.getISTDateString();

    for (const loan of activeLoans) {
      // Find customer info
      const customer = loan.customer;
      if (!customer || !customer.id) continue;

      const user = await db.getUserById(customer.id);
      if (!user || !user.email) continue;

      // 2. Get installments for this loan
      const installments = await db.getInstallmentsByLoanId(loan.id);
      const unpaid = installments.filter((i: any) => i.status === 'Unpaid');
      if (unpaid.length === 0) continue;

      // 3. Check for overdue or due today
      const overdueInstallments = unpaid.filter((i: any) => i.due_date < todayStr);
      const dueTodayInstallment = unpaid.find((i: any) => i.due_date === todayStr);

      const isOverdue = overdueInstallments.length > 0;
      const isDueToday = !!dueTodayInstallment;

      if (isOverdue || isDueToday) {
        // Send email reminder
        const dueAmount = loan.daily_installment;
        const overdueCount = overdueInstallments.length;
        const remainingBalance = loan.remaining_balance;

        const emailSentStatus = await sendDuesReminderEmail(
          user.email,
          user.full_name,
          dueAmount,
          overdueCount,
          remainingBalance
        );

        if (emailSentStatus) {
          emailsSent++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed reminders. Sent ${emailsSent} reminder email(s).`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Cron reminders error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send cron reminders.' });
  }
};
