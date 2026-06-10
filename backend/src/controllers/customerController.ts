import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import { uploadToCloudinary } from '../config/cloudinary';
import { saveBase64File } from '../utils/file';

export const getCustomerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;

    // Fetch active/pending loan
    const activeLoan = await db.getActiveLoanByCustomerId(customerId);
    const notifications = await db.getNotificationsByUserId(customerId);

    let summary: any = {
      hasActiveLoan: false,
      loan: null,
      installments: [],
      nextDue: null,
      dueTodayAmount: 0,
      remainingInstallmentsCount: 0,
      progressPercentage: 0,
      paidAmount: 0
    };

    if (activeLoan) {
      const installments = await db.getInstallmentsByLoanId(activeLoan.id);
      const paid = installments.filter((i: any) => i.status === 'Paid');
      const pending = installments.filter((i: any) => i.status === 'Pending');
      const unpaid = installments.filter((i: any) => i.status === 'Unpaid');

      // Find next due date
      const todayStr = db.getISTDateString();
      const nextDueInstallment = unpaid.find((i: any) => i.due_date >= todayStr) || unpaid[0];

      const paidAmount = paid.length * activeLoan.daily_installment;
      const progressPercentage = Math.round((paidAmount / activeLoan.approved_amount) * 100);

      // Overdue calculation: unpaid installments where due_date is before today
      const overdueInstallments = unpaid.filter((i: any) => i.due_date < todayStr);
      const overdueCount = overdueInstallments.length;
      const overdueAmount = overdueCount * activeLoan.daily_installment;

      // Zomato style notification: check if customer has overdue installments and hasn't been warned recently
      if (overdueCount > 0 && activeLoan.status === 'Active') {
        const recentNotif = notifications.find(
          (n: any) => (n.title.includes('Alert') || n.title.includes('Reminder') || n.type === 'alert') && 
                      (new Date().getTime() - new Date(n.created_at).getTime()) < 1 * 60 * 60 * 1000 // 1 hour threshold to avoid spam
        );
        if (!recentNotif) {
          const titles = [
            "⚠️ Missed Installment Alert!",
            "⏳ Repayment Reminder: Profile Status At Risk!",
            "🚨 Action Required: Lending Score Impact Warning",
            "💳 Settle your overdue installments!"
          ];
          const messages = [
            `Hey! You have ${overdueCount} missed daily installment${overdueCount > 1 ? 's' : ''} (Total: ₹${overdueAmount}). Your lending profile score will be affected if you do not pay on time. Settle immediately!`,
            `Avoid profile deactivation! You have ₹${overdueAmount} overdue. Your lending history will be affected if you do not pay on time.`,
            `Urgent: Settle your ₹${overdueAmount} unpaid dues to prevent your credit score profile from being negatively affected.`
          ];
          // Pick based on overdue count or random
          const selectedTitle = titles[Math.min(overdueCount - 1, titles.length - 1)];
          const selectedMsg = messages[Math.min(overdueCount - 1, messages.length - 1)];
          await db.createNotification(customerId, selectedTitle, selectedMsg, 'alert');
        }
      }

      const dueTodayInstallment = unpaid.find((i: any) => i.due_date === todayStr);
      const pendingInstallmentsList = overdueInstallments.concat(dueTodayInstallment ? [dueTodayInstallment] : []);

      summary = {
        hasActiveLoan: true,
        loan: activeLoan,
        installmentsCount: installments.length,
        paidInstallmentsCount: paid.length,
        pendingInstallmentsCount: pending.length,
        remainingInstallmentsCount: unpaid.length,
        progressPercentage,
        paidAmount,
        nextDue: nextDueInstallment ? nextDueInstallment.due_date : null,
        nextDueInstallmentId: nextDueInstallment ? nextDueInstallment.id : null,
        dueTodayAmount: activeLoan.status === 'Active' ? activeLoan.daily_installment : 0,
        overdueCount,
        overdueAmount,
        unpaidInstallments: installments.filter((i: any) => i.status !== 'Paid').slice(0, 5),
        pendingInstallmentIds: pendingInstallmentsList.map((i: any) => i.id)
      };
    }

    // Embed unread count in summary for Dashboard typescript compatibility
    const unreadNotificationsCount = notifications.filter((n: any) => n.is_read === 0).length;
    summary.unreadNotificationsCount = unreadNotificationsCount;

    return res.status(200).json({
      summary,
      unreadNotificationsCount
    });
  } catch (error: any) {
    console.error('Customer dashboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
  }
};

export const getLoanDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;
    const { id } = req.params;

    const loan = await db.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    // Security check: Customer can only view their own loans
    if (loan.customer_id !== customerId) {
      return res.status(403).json({ error: 'Access denied to this loan record.' });
    }

    const installments = await db.getInstallmentsByLoanId(id);
    return res.status(200).json({ loan, installments });
  } catch (error: any) {
    console.error('Customer loan details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve loan details.' });
  }
};

export const getLoanHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const loans = await db.getLoansByCustomerId(req.user.id);
    return res.status(200).json(loans);
  } catch (error: any) {
    console.error('Customer loan history error:', error);
    return res.status(500).json({ error: 'Failed to retrieve loan history.' });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const notifications = await db.getNotificationsByUserId(req.user.id);
    return res.status(200).json(notifications);
  } catch (error: any) {
    console.error('Get customer notifications error:', error);
    return res.status(500).json({ error: 'Failed to load notifications.' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await db.markNotificationRead(id);
    return res.status(200).json({ message: 'Notification read.', notification: updated });
  } catch (error: any) {
    console.error('Read notification error:', error);
    return res.status(500).json({ error: 'Failed to read notification.' });
  }
};

export const requestLoan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;
    const { amount, duration_days } = req.body;

    if (!amount || !duration_days) {
      return res.status(400).json({ error: 'Missing required loan parameters.' });
    }

    const customer = await db.getUserById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (customer.status !== 'approved') {
      return res.status(400).json({ error: 'Your account must be approved before requesting a loan.' });
    }

    // Only one active/pending loan per customer
    const activeLoan = await db.getActiveLoanByCustomerId(customerId);
    if (activeLoan) {
      return res.status(400).json({ error: 'You already have an active or pending loan.' });
    }

    // Calculations for initial request (admin will override with final terms on approval)
    const approved_amount = Number(amount);
    const platform_charges = Math.round(approved_amount * 0.05); // 5% platform charge (upfront deduction)
    const amount_disbursed = approved_amount - platform_charges;
    // Initial total_repayment = approved_amount (admin will add interest when approving)
    const total_repayment = approved_amount;
    const remaining_balance = total_repayment;
    const daily_installment = Math.round(total_repayment / Number(duration_days));

    const newLoan = await db.createLoan({
      customer_id: customerId,
      approved_amount,
      platform_charges,
      amount_disbursed,
      daily_installment,
      duration_days: Number(duration_days),
      total_repayment,
      remaining_balance,
      status: 'Pending'
    });

    // Notify user & admin
    await db.createNotification(
      customerId,
      'Loan Request Submitted',
      `Your request for a loan of ₹${approved_amount} has been submitted for admin approval.`,
      'loan'
    );

    return res.status(201).json({
      message: 'Loan request submitted successfully.',
      loan: newLoan
    });
  } catch (error: any) {
    console.error('Customer loan request error:', error);
    return res.status(500).json({ error: 'Failed to submit loan request.' });
  }
};

export const payInstallment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;

    // Get active loan
    const activeLoan = await db.getActiveLoanByCustomerId(customerId);
    if (!activeLoan) {
      return res.status(404).json({ error: 'No active loan found to make repayment.' });
    }
    if (activeLoan.status !== 'Active') {
      return res.status(400).json({ error: 'Loan is not active.' });
    }

    // Get unpaid installments ordered by due_date
    const installments = await db.getInstallmentsByLoanId(activeLoan.id);
    const unpaidInstallments = installments.filter((i: any) => i.status === 'Unpaid');
    if (unpaidInstallments.length === 0) {
      return res.status(400).json({ error: 'All installments are already paid.' });
    }

    const oldestUnpaid = unpaidInstallments[0]; // First unpaid installment

    // Mark paid
    const now = db.getISTDateTimeString();
    await db.markInstallmentPaid(oldestUnpaid.id, now);

    // Calculate new balance
    const newBalance = Math.max(0, activeLoan.remaining_balance - activeLoan.daily_installment);
    let isCompleted = newBalance <= 0;
    if (unpaidInstallments.length === 1) {
      isCompleted = true;
    }

    let updatedLoan;
    if (isCompleted) {
      updatedLoan = await db.updateLoanStatus(activeLoan.id, 'Completed', {
        remaining_balance: 0,
        completion_date: now
      });
      await db.createNotification(
        customerId,
        'Loan Fully Repaid!',
        `Congratulations! Your loan of ₹${activeLoan.approved_amount} is fully repaid and closed.`,
        'loan'
      );
    } else {
      updatedLoan = await db.updateLoanStatus(activeLoan.id, 'Active', {
        remaining_balance: newBalance
      });
      await db.createNotification(
        customerId,
        'Installment Paid',
        `Repayment of ₹${activeLoan.daily_installment} successful. Remaining balance: ₹${newBalance}.`,
        'payment'
      );
    }

    return res.status(200).json({
      message: 'Repayment successful.',
      installment: { ...oldestUnpaid, status: 'Paid', payment_date: now },
      loan: updatedLoan
    });
  } catch (error: any) {
    console.error('Customer payment error:', error);
    return res.status(500).json({ error: 'Failed to process payment.' });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const upiQrUrl = await db.getSetting('upi_qr_url', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=dakshinamurthy@ybl%26pn=Dakshinamurthy%20Daily%20Finance');
    const upiMobileNumber = await db.getSetting('upi_mobile_number', '9999999999');
    const defaultDuration = await db.getSetting('default_duration', '50');
    const officialUpiId = await db.getSetting('official_upi_id', 'dakshinamurthy@ybl');
    return res.status(200).json({ 
      settings: { 
        upi_qr_url: upiQrUrl,
        upi_mobile_number: upiMobileNumber,
        default_duration: defaultDuration,
        official_upi_id: officialUpiId
      } 
    });
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

export const submitPaymentProof = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;
    let { installmentId, installmentIds, transaction_id } = req.body;
    if (installmentId && !installmentIds) {
      installmentIds = [installmentId];
    }

    if (!installmentIds || !Array.isArray(installmentIds) || installmentIds.length === 0 || !transaction_id) {
      return res.status(400).json({ error: 'Installment ID(s) and UTR/Transaction ID are required.' });
    }

    if (!req.file && !req.body.proof_base64) {
      return res.status(400).json({ error: 'Please upload a payment screenshot proof.' });
    }

    // Validate all installments first
    const validatedInstallments = [];
    for (const instId of installmentIds) {
      const installment = await db.getInstallmentById(instId);
      if (!installment) {
        return res.status(404).json({ error: `Installment record not found for ID: ${instId}` });
      }

      const loan = await db.getLoanById(installment.loan_id);
      if (!loan || loan.customer_id !== customerId) {
        return res.status(403).json({ error: `Unauthorized access to loan installment ID: ${instId}` });
      }

      if (installment.status === 'Paid') {
        return res.status(400).json({ error: `Installment due on ${installment.due_date} is already paid.` });
      }
      validatedInstallments.push(installment);
    }

    // Process file (file upload or base64)
    let fileToProcess: { path: string; filename: string; originalname: string } | null = null;
    if (req.file) {
      fileToProcess = {
        path: req.file.path,
        filename: req.file.filename,
        originalname: req.file.originalname,
      };
    } else if (req.body.proof_base64) {
      try {
        fileToProcess = saveBase64File(req.body.proof_base64, 'proof', 'proof');
      } catch (err: any) {
        return res.status(400).json({ error: 'Failed to process uploaded base64 screenshot proof: ' + err.message });
      }
    }

    if (!fileToProcess) {
      return res.status(400).json({ error: 'Please upload a payment screenshot proof.' });
    }

    // Upload screenshot to Cloudinary
    let proof_url = '';
    try {
      proof_url = await uploadToCloudinary(fileToProcess.path);
      if (fs.existsSync(fileToProcess.path)) {
        fs.unlinkSync(fileToProcess.path);
      }
    } catch (err) {
      console.error('Cloudinary upload error, using local fallback:', err);
      proof_url = `/uploads/proof/${fileToProcess.filename}`;
    }

    // Submit payment proof (sets status to 'Pending') for all installments
    const updatedInstallments = [];
    for (const inst of validatedInstallments) {
      const updated = await db.submitInstallmentProof(inst.id, transaction_id, proof_url);
      updatedInstallments.push(updated);
    }

    // Notify customer
    await db.createNotification(
      customerId,
      'Payment Proof Submitted',
      `Your payment proof for UTR: ${transaction_id} (covering ${validatedInstallments.length} installment(s)) is submitted and is pending verification.`,
      'payment'
    );

    return res.status(200).json({
      message: 'Payment proof submitted successfully and is pending verification.',
      installments: updatedInstallments
    });
  } catch (error: any) {
    console.error('Submit payment proof error:', error);
    return res.status(500).json({ error: 'Failed to submit payment proof.' });
  }
};

export const forecloseLoan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;
    const { id } = req.params;

    // Fetch the loan
    const loan = await db.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    if (loan.customer_id !== customerId) {
      return res.status(403).json({ error: 'Access denied to this loan.' });
    }
    if (loan.status !== 'Active') {
      return res.status(400).json({ error: 'Only active loans can be foreclosed.' });
    }

    // Mark all unpaid installments as Paid
    const installments = await db.getInstallmentsByLoanId(id);
    const unpaid = installments.filter((i: any) => i.status !== 'Paid');
    if (unpaid.length === 0) {
      return res.status(400).json({ error: 'All installments are already paid.' });
    }

    const now = db.getISTDateTimeString();
    for (const inst of unpaid) {
      await db.markInstallmentPaid(inst.id, now);
    }

    // Close the loan
    const foreclosureAmount = loan.remaining_balance;
    await db.updateLoanStatus(loan.id, 'Completed', {
      remaining_balance: 0,
      completion_date: now
    });

    // Notify customer
    await db.createNotification(
      customerId,
      'Loan Foreclosed Successfully 🎉',
      `Your loan of ₹${loan.approved_amount} has been foreclosed by paying ₹${foreclosureAmount}. Loan is now closed.`,
      'loan'
    );

    return res.status(200).json({
      message: 'Loan foreclosed successfully.',
      foreclosureAmount,
      loanId: loan.id
    });
  } catch (error: any) {
    console.error('Foreclose loan error:', error);
    return res.status(500).json({ error: 'Failed to foreclose loan.' });
  }
};

export const submitForeclosureProof = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const customerId = req.user.id;
    const { id } = req.params;
    const { transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: 'UTR/Transaction ID is required.' });
    }
    if (!req.file && !req.body.proof_base64) {
      return res.status(400).json({ error: 'Please upload a payment screenshot proof.' });
    }

    // Verify the loan belongs to this customer
    const loan = await db.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    if (loan.customer_id !== customerId) {
      return res.status(403).json({ error: 'Access denied to this loan.' });
    }
    if (loan.status !== 'Active') {
      return res.status(400).json({ error: 'Only active loans can be foreclosed.' });
    }

    // Process file (file upload or base64)
    let fileToProcess: { path: string; filename: string; originalname: string } | null = null;
    if (req.file) {
      fileToProcess = {
        path: req.file.path,
        filename: req.file.filename,
        originalname: req.file.originalname,
      };
    } else if (req.body.proof_base64) {
      try {
        fileToProcess = saveBase64File(req.body.proof_base64, 'foreclose-proof', 'proof');
      } catch (err: any) {
        return res.status(400).json({ error: 'Failed to process uploaded base64 screenshot proof: ' + err.message });
      }
    }

    if (!fileToProcess) {
      return res.status(400).json({ error: 'Please upload a payment screenshot proof.' });
    }

    // Upload proof screenshot
    let proof_url = '';
    try {
      const { uploadToCloudinary } = await import('../config/cloudinary');
      proof_url = await uploadToCloudinary(fileToProcess.path);
      const fs = await import('fs');
      if (fs.existsSync(fileToProcess.path)) {
        fs.unlinkSync(fileToProcess.path);
      }
    } catch (err) {
      console.error('Cloudinary upload error, using local fallback:', err);
      proof_url = `/uploads/proof/${fileToProcess.filename}`;
    }

    // Mark all unpaid installments as Pending with the proof
    const installments = await db.getInstallmentsByLoanId(id);
    const unpaid = installments.filter((i: any) => i.status !== 'Paid');
    if (unpaid.length === 0) {
      return res.status(400).json({ error: 'All installments are already paid.' });
    }

    for (const inst of unpaid) {
      await db.submitInstallmentProof(inst.id, transaction_id, proof_url);
    }

    // Notify customer
    await db.createNotification(
      customerId,
      'Foreclosure Proof Submitted ⏳',
      `Your foreclosure payment proof (UTR: ${transaction_id}) for ₹${loan.remaining_balance} has been submitted. Your loan will be closed once the admin verifies the payment.`,
      'loan'
    );

    return res.status(200).json({
      message: 'Foreclosure proof submitted successfully. Awaiting admin verification.',
      loanId: loan.id,
      pendingInstallments: unpaid.length
    });
  } catch (error: any) {
    console.error('Submit foreclosure proof error:', error);
    return res.status(500).json({ error: 'Failed to submit foreclosure proof.' });
  }
};
