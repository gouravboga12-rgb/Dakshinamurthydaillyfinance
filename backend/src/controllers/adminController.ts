import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import { uploadToCloudinary } from '../config/cloudinary';

// --- CUSTOMER MANAGEMENT ---

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const users = await db.getUsers({ role: 'customer' });
    
    let filtered = users;
    if (status) {
      filtered = filtered.filter((u: any) => u.status === status);
    }
    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter((u: any) => 
        u.full_name.toLowerCase().includes(s) || 
        u.mobile_number.includes(s) ||
        (u.email && u.email.toLowerCase().includes(s))
      );
    }

    // Map loan counts and active loan counts to each customer
    const loans = await db.getLoans();
    const userLoansMap = loans.reduce((acc: any, loan: any) => {
      const custId = loan.customer_id;
      if (!acc[custId]) {
        acc[custId] = { totalLoans: 0, activeLoans: 0 };
      }
      acc[custId].totalLoans += 1;
      if (loan.status === 'Active') {
        acc[custId].activeLoans += 1;
      }
      return acc;
    }, {});

    const enriched = filtered.map((u: any) => ({
      ...u,
      loan_count: userLoansMap[u.id]?.totalLoans || 0,
      active_loan_count: userLoansMap[u.id]?.activeLoans || 0
    }));

    return res.status(200).json(enriched);
  } catch (error: any) {
    console.error('Get customers error:', error);
    return res.status(500).json({ error: 'Failed to fetch customers.' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, mobile_number, email, occupation, shop_name, address, password } = req.body;
    if (!full_name || !mobile_number || !password) {
      return res.status(400).json({ error: 'Name, Mobile Number, and Password are required.' });
    }

    const existing = await db.getUserByMobile(mobile_number);
    if (existing) {
      return res.status(400).json({ error: 'Customer mobile number already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const aadhaarFile = files?.['aadhaar']?.[0];
    const avatarFile = files?.['avatar']?.[0];

    // Upload Aadhaar to Cloudinary if provided
    let aadhaar_url = null;
    if (aadhaarFile) {
      try {
        aadhaar_url = await uploadToCloudinary(aadhaarFile.path);
        // Delete local temp file
        if (fs.existsSync(aadhaarFile.path)) {
          fs.unlinkSync(aadhaarFile.path);
        }
      } catch (err) {
        console.error('Error uploading to Cloudinary, falling back to local storage:', err);
        aadhaar_url = `/uploads/aadhaar/${aadhaarFile.filename}`;
      }
    }

    // Upload Avatar to Cloudinary if provided
    let avatar_url = null;
    if (avatarFile) {
      try {
        avatar_url = await uploadToCloudinary(avatarFile.path);
        // Delete local temp file
        if (fs.existsSync(avatarFile.path)) {
          fs.unlinkSync(avatarFile.path);
        }
      } catch (err) {
        console.error('Error uploading Avatar to Cloudinary, falling back to local storage:', err);
        avatar_url = `/uploads/avatar/${avatarFile.filename}`;
      }
    }

    const newUser = await db.createUser({
      full_name,
      mobile_number,
      email,
      occupation,
      shop_name,
      address,
      password_hash,
      role: 'customer',
      status: 'approved', // Created directly by Admin, auto-approved
      aadhaar_url,
      avatar_url
    });

    await db.createNotification(newUser.id, 'Welcome!', 'Your account has been created by the administrator.', 'system');

    return res.status(201).json({ message: 'Customer created successfully.', user: newUser });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return res.status(500).json({ error: 'Failed to create customer.' });
  }
};

export const updateCustomerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'deactivated'

    if (!['approved', 'rejected', 'deactivated', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid user status.' });
    }

    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const updatedUser = await db.updateUserStatus(id, status);

    // Send notifications based on status change
    if (status === 'approved') {
      await db.createNotification(id, 'Account Approved', 'Your registration has been approved! You can now login.', 'status');
    } else if (status === 'rejected') {
      await db.createNotification(id, 'Account Rejected', 'Your registration was rejected. Contact support for details.', 'status');
    }

    return res.status(200).json({ message: `Customer status updated to ${status}.`, user: updatedUser });
  } catch (error: any) {
    console.error('Update customer status error:', error);
    return res.status(500).json({ error: 'Failed to update customer status.' });
  }
};

export const editCustomerDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, email, occupation, shop_name, address } = req.body;
    
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const updated = await db.updateUser(id, { full_name, email, occupation, shop_name, address });
    return res.status(200).json({ message: 'Customer details updated.', user: updated });
  } catch (error: any) {
    console.error('Edit customer details error:', error);
    return res.status(500).json({ error: 'Failed to update customer details.' });
  }
};

export const getCustomerDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const loans = await db.getLoansByCustomerId(id);
    
    const { password_hash, ...profile } = user;
    return res.status(200).json({ profile, loans });
  } catch (error: any) {
    console.error('Get customer details error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer profile.' });
  }
};

export const uploadCustomerAadhaar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let aadhaar_url: string;
    try {
      aadhaar_url = await uploadToCloudinary(req.file.path);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error('Cloudinary upload failed, using local storage:', err);
      aadhaar_url = `/uploads/aadhaar/${req.file.filename}`;
    }

    const updated = await db.updateUser(id, { aadhaar_url });
    return res.status(200).json({ message: 'Aadhaar uploaded successfully.', aadhaar_url: updated?.aadhaar_url || aadhaar_url });
  } catch (error: any) {
    console.error('Upload Aadhaar error:', error);
    return res.status(500).json({ error: 'Failed to upload Aadhaar.' });
  }
};

export const uploadCustomerAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    let avatar_url: string;
    try {
      avatar_url = await uploadToCloudinary(req.file.path);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error('Cloudinary upload failed, using local storage:', err);
      avatar_url = `/uploads/avatar/${req.file.filename}`;
    }

    const updated = await db.updateUser(id, { avatar_url });
    return res.status(200).json({ message: 'Profile photo uploaded successfully.', avatar_url: updated?.avatar_url || avatar_url });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ error: 'Failed to upload profile photo.' });
  }
};

// --- LOAN MANAGEMENT ---

export const getLoans = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, sort } = req.query;
    const loans = await db.getLoans({
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      sort: sort ? String(sort) : undefined
    });
    return res.status(200).json(loans);
  } catch (error: any) {
    console.error('Get loans error:', error);
    return res.status(500).json({ error: 'Failed to retrieve loans.' });
  }
};

export const createLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { customer_id, approved_amount, platform_charges, daily_installment, duration_days, total_repayment } = req.body;

    if (!customer_id || !approved_amount || !platform_charges || !daily_installment || !duration_days) {
      return res.status(400).json({ error: 'Missing required loan parameters.' });
    }

    // Verify customer exists and is approved
    const customer = await db.getUserById(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    if (customer.status !== 'approved') {
      return res.status(400).json({ error: 'Cannot issue loans to unapproved or deactivated customers.' });
    }

    // Business Rule: Only one active loan per customer
    const activeLoan = await db.getActiveLoanByCustomerId(customer_id);
    if (activeLoan) {
      return res.status(400).json({ error: 'Customer already has an active or pending loan. Repay it first.' });
    }

    // Calculations
    const amount_disbursed = Number(approved_amount) - Number(platform_charges);
    const repaymentTarget = total_repayment !== undefined ? Number(total_repayment) : Number(approved_amount);
    const remaining_balance = repaymentTarget;

    const newLoan = await db.createLoan({
      customer_id,
      approved_amount: Number(approved_amount),
      platform_charges: Number(platform_charges),
      amount_disbursed,
      daily_installment: Number(daily_installment),
      duration_days: Number(duration_days),
      total_repayment: repaymentTarget,
      remaining_balance,
      status: 'Pending' // Initial state is Pending, requires Approval
    });

    await db.createNotification(customer_id, 'New Loan Request Created', `A new loan request of ₹${approved_amount} has been registered.`, 'loan');

    return res.status(201).json({ message: 'Loan request created.', loan: newLoan });
  } catch (error: any) {
    console.error('Create loan error:', error);
    return res.status(500).json({ error: 'Failed to create loan.' });
  }
};

export const approveLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }
    if (loan.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot approve loan in '${loan.status}' status.` });
    }

    const { approved_amount, platform_charges, amount_disbursed, daily_installment, duration_days, total_repayment } = req.body;

    // Update status to Active
    const now = new Date().toISOString();
    const additionalFields: any = {
      approval_date: now
    };

    if (approved_amount !== undefined) {
      additionalFields.approved_amount = Number(approved_amount);
    }
    if (total_repayment !== undefined) {
      additionalFields.total_repayment = Number(total_repayment);
      additionalFields.remaining_balance = Number(total_repayment);
    } else if (approved_amount !== undefined) {
      additionalFields.total_repayment = Number(approved_amount);
      additionalFields.remaining_balance = Number(approved_amount);
    }
    if (platform_charges !== undefined) {
      additionalFields.platform_charges = Number(platform_charges);
    }
    if (amount_disbursed !== undefined) {
      additionalFields.amount_disbursed = Number(amount_disbursed);
    }
    if (daily_installment !== undefined) {
      additionalFields.daily_installment = Number(daily_installment);
    }
    if (duration_days !== undefined) {
      additionalFields.duration_days = Number(duration_days);
    }

    const updatedLoan = await db.updateLoanStatus(id, 'Active', additionalFields);

    // Automatically generate daily installments
    const installments = [];
    const startDate = new Date(); // Start tomorrow.
    for (let i = 1; i <= updatedLoan.duration_days; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + i);
      installments.push({
        id: crypto.randomUUID(),
        loan_id: id,
        due_date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
        status: 'Unpaid',
        payment_date: null,
        created_at: now
      });
    }
    await db.createInstallments(installments);

    await db.createNotification(
      updatedLoan.customer_id,
      'Loan Approved!',
      `Your loan request of ₹${updatedLoan.approved_amount} has been approved. Daily installment is ₹${updatedLoan.daily_installment}.`,
      'loan'
    );

    return res.status(200).json({ message: 'Loan approved. Installments generated.', loan: updatedLoan });
  } catch (error: any) {
    console.error('Approve loan error:', error);
    return res.status(500).json({ error: 'Failed to approve loan.' });
  }
};

export const rejectLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    if (loan.status !== 'Pending') {
      return res.status(400).json({ error: 'Can only reject pending loan requests.' });
    }

    const updated = await db.updateLoanStatus(id, 'Rejected');
    await db.createNotification(loan.customer_id, 'Loan Rejected', `Your loan request of ₹${loan.approved_amount} was rejected.`, 'loan');

    return res.status(200).json({ message: 'Loan request rejected.', loan: updated });
  } catch (error: any) {
    console.error('Reject loan error:', error);
    return res.status(500).json({ error: 'Failed to reject loan.' });
  }
};

export const closeLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const now = new Date().toISOString();
    const updated = await db.updateLoanStatus(id, 'Completed', {
      completion_date: now,
      remaining_balance: 0
    });

    await db.createNotification(loan.customer_id, 'Loan Completed', `Your loan of ₹${loan.approved_amount} has been successfully closed.`, 'loan');

    return res.status(200).json({ message: 'Loan marked as completed manually.', loan: updated });
  } catch (error: any) {
    console.error('Close loan error:', error);
    return res.status(500).json({ error: 'Failed to close loan.' });
  }
};

export const getLoanDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    const customer = await db.getUserById(loan.customer_id);
    const installments = await db.getInstallmentsByLoanId(id);

    return res.status(200).json({
      loan,
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        mobile_number: customer.mobile_number,
        email: customer.email,
        address: customer.address
      },
      installments
    });
  } catch (error: any) {
    console.error('Get loan details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve loan details.' });
  }
};

// --- PAYMENT TRACKING ---

export const markInstallmentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) {
      return res.status(400).json({ error: 'Installment ID is required.' });
    }

    const installment = await db.getInstallmentById(installmentId);
    if (!installment) {
      return res.status(404).json({ error: 'Installment not found.' });
    }
    if (installment.status === 'Paid') {
      return res.status(400).json({ error: 'Installment is already paid.' });
    }

    const loan = await db.getLoanById(installment.loan_id);
    if (!loan) {
      return res.status(404).json({ error: 'Associated loan not found.' });
    }

    // Mark paid
    const now = new Date().toISOString();
    await db.markInstallmentPaid(installmentId, now);

    // Calculate new balance
    // Remaining balance reduces by the installment amount orapproved daily amount (usually the installment amount).
    // Let's deduce daily installment.
    const newBalance = Math.max(0, loan.remaining_balance - loan.daily_installment);
    
    let isCompleted = newBalance <= 0;
    
    // Double check if there are any remaining unpaid or pending installments
    const installments = await db.getInstallmentsByLoanId(loan.id);
    const unpaidCount = installments.filter((i: any) => i.id !== installmentId && i.status !== 'Paid').length;
    
    if (unpaidCount === 0) {
      isCompleted = true;
    }

    let updatedLoan;
    if (isCompleted) {
      // Auto complete the loan!
      updatedLoan = await db.updateLoanStatus(loan.id, 'Completed', {
        remaining_balance: 0,
        completion_date: now
      });
      await db.createNotification(
        loan.customer_id,
        'Loan Fully Repaid!',
        `Congratulations! Your loan of ₹${loan.approved_amount} is fully repaid and closed. You are now eligible for a new loan.`,
        'loan'
      );
    } else {
      updatedLoan = await db.updateLoanStatus(loan.id, 'Active', {
        remaining_balance: newBalance
      });
      await db.createNotification(
        loan.customer_id,
        'Installment Paid',
        `Installment due on ${installment.due_date} of ₹${loan.daily_installment} marked as Paid. Remaining balance: ₹${newBalance}.`,
        'payment'
      );
    }

    return res.status(200).json({
      message: 'Installment marked as Paid.',
      installment: { ...installment, status: 'Paid', payment_date: now },
      loan: updatedLoan
    });
  } catch (error: any) {
    console.error('Mark installment paid error:', error);
    return res.status(500).json({ error: 'Failed to record payment.' });
  }
};

// --- ANALYTICS & REPORTS ---

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await db.getDashboardAnalytics();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query; // 'daily_collection' | 'daily_profit' | 'outstanding' | 'efficiency'
    const today = new Date().toISOString().split('T')[0];

    if (type === 'daily_collection') {
      const collections = await db.getInstallmentsPaidToday();
      return res.status(200).json({
        reportName: 'Daily Collection Report',
        date: today,
        data: collections
      });
    }

    if (type === 'pending_approvals') {
      const list = await db.getPendingPayments();
      return res.status(200).json({
        reportName: 'Pending Payment Approvals Report',
        date: today,
        data: list
      });
    }

    if (type === 'monthly_summary') {
      const currentYear = new Date().getFullYear();
      const allLoans = await db.getLoans();
      const paidInstallments = await db.getPaidInstallments();

      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const data = months.map((monthName, index) => {
        const monthNum = index + 1;
        const monthPrefix = `${currentYear}-${String(monthNum).padStart(2, '0')}`;

        // Loans disbursed in this month
        const disbursedLoans = allLoans.filter((l: any) => 
          l.approval_date && l.approval_date.startsWith(monthPrefix)
        );
        const loansCount = disbursedLoans.length;
        const totalDisbursed = disbursedLoans.reduce((sum: number, l: any) => sum + (l.approved_amount || 0), 0);
        const platformCharges = disbursedLoans.reduce((sum: number, l: any) => sum + (l.platform_charges || 0), 0);

        // Collections in this month
        const collections = paidInstallments.filter((inst: any) => 
          inst.payment_date && inst.payment_date.startsWith(monthPrefix)
        );
        const totalCollected = collections.reduce((sum: number, inst: any) => 
          sum + (inst.loan?.daily_installment || inst.amount || 0), 0
        );

        return {
          month: monthName,
          monthKey: monthPrefix,
          loansCount,
          totalDisbursed,
          platformCharges,
          totalCollected
        };
      });

      return res.status(200).json({
        reportName: `Monthly Financial Summary (${currentYear})`,
        year: currentYear,
        data
      });
    }

    if (type === 'daily_profit') {
      // In our model: Profit = Sum of Platform charges of active loans approved today
      const loans = await db.getLoans();
      const approvedToday = loans.filter((l: any) => l.approval_date && l.approval_date.startsWith(today));
      const platformFeeProfit = approvedToday.reduce((sum: number, l: any) => sum + (l.platform_charges || 0), 0);

      return res.status(200).json({
        reportName: 'Daily Profit Report',
        date: today,
        totalProfit: platformFeeProfit,
        loansDisbursed: approvedToday.length,
        details: approvedToday.map((l: any) => ({
          loanId: l.id,
          customerName: l.customer?.full_name,
          approvedAmount: l.approved_amount,
          platformCharges: l.platform_charges
        }))
      });
    }

    if (type === 'portfolio_outstanding') {
      const customers = await db.getUsers({ role: 'customer' });
      const customerMap = new Map();
      
      customers.forEach((c: any) => {
        customerMap.set(c.id, {
          id: c.id,
          name: c.full_name,
          mobile: c.mobile_number,
          activeLoans: 0,
          totalApproved: 0,
          totalPaid: 0,
          remainingBalance: 0,
          overdueCount: 0,
          overdueAmount: 0,
          pendingCount: 0,
          pendingAmount: 0
        });
      });

      const allLoans = await db.getLoans();
      allLoans.forEach((l: any) => {
        const cust = customerMap.get(l.customer_id);
        if (cust) {
          if (l.status === 'Active') {
            cust.activeLoans += 1;
            cust.totalApproved += l.approved_amount || 0;
            cust.totalPaid += ((l.total_repayment || 0) - (l.remaining_balance || 0));
            cust.remainingBalance += l.remaining_balance || 0;
          }
        }
      });

      const installments = await db.getPortfolioInstallments();
      const losses: any[] = [];
      const pendingPayments: any[] = [];

      installments.forEach((inst: any) => {
        const custId = inst.loan?.customer_id;
        const cust = customerMap.get(custId);
        const dailyInst = inst.loan?.daily_installment || inst.daily_installment || 0;

        if (inst.status === 'Unpaid') {
          if (inst.due_date < today) {
            const dueTime = new Date(inst.due_date).getTime();
            const todayTime = new Date(today).getTime();
            const diffTime = todayTime - dueTime;
            const daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            losses.push({
              id: inst.id,
              loanId: inst.loan_id,
              customerName: inst.loan?.customer?.full_name || 'Unknown',
              mobile: inst.loan?.customer?.mobile_number || '',
              dueDate: inst.due_date,
              amount: dailyInst,
              daysOverdue
            });

            if (cust) {
              cust.overdueCount += 1;
              cust.overdueAmount += dailyInst;
            }
          }
        } else if (inst.status === 'Pending') {
          pendingPayments.push({
            id: inst.id,
            loanId: inst.loan_id,
            customerName: inst.loan?.customer?.full_name || 'Unknown',
            mobile: inst.loan?.customer?.mobile_number || '',
            paymentDate: inst.payment_date,
            transactionId: inst.transaction_id,
            proofUrl: inst.proof_url,
            amount: dailyInst
          });

          if (cust) {
            cust.pendingCount += 1;
            cust.pendingAmount += dailyInst;
          }
        }
      });

      const membersDetails = Array.from(customerMap.values());
      const activeLoans = allLoans.filter((l: any) => l.status === 'Active');
      const totalOutstanding = activeLoans.reduce((sum: number, l: any) => sum + (l.remaining_balance || 0), 0);
      const totalLosses = losses.reduce((sum: number, l: any) => sum + l.amount, 0);
      const totalPending = pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const activeMembersCount = membersDetails.filter((m: any) => m.activeLoans > 0).length;

      return res.status(200).json({
        reportName: 'Portfolio Risk & Outstanding Balances',
        date: today,
        metrics: {
          totalLosses,
          totalPending,
          totalOutstanding,
          totalMembers: customers.length,
          activeMembers: activeMembersCount
        },
        losses,
        pendingPayments,
        membersDetails
      });
    }

    // Default: Return a generic loan performance overview
    const allLoans = await db.getLoans();
    const active = allLoans.filter((l: any) => l.status === 'Active');
    const completed = allLoans.filter((l: any) => l.status === 'Completed');
    const pending = allLoans.filter((l: any) => l.status === 'Pending');

    return res.status(200).json({
      reportName: 'Loan Performance Report',
      metrics: {
        totalLoansCreated: allLoans.length,
        activeCount: active.length,
        completedCount: completed.length,
        pendingCount: pending.length,
        totalOutstanding: active.reduce((sum: number, l: any) => sum + l.remaining_balance, 0)
      }
    });
  } catch (error: any) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to generate reports.' });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const upiQrUrl = await db.getSetting('upi_qr_url', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=dakshinamurthy@ybl%26pn=Dakshinamurthy%20Daily%20Finance');
    const upiMobileNumber = await db.getSetting('upi_mobile_number', '9999999999');
    const platformFee = await db.getSetting('platform_fee', '1000');
    const defaultDuration = await db.getSetting('default_duration', '50');
    const defaultInstallment = await db.getSetting('default_installment', '200');
    
    return res.status(200).json({ 
      settings: { 
        upi_qr_url: upiQrUrl,
        upi_mobile_number: upiMobileNumber,
        platform_fee: platformFee,
        default_duration: defaultDuration,
        default_installment: defaultInstallment
      } 
    });
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { upi_mobile_number, platform_fee, default_duration, default_installment } = req.body;
    
    if (upi_mobile_number !== undefined) {
      await db.updateSetting('upi_mobile_number', String(upi_mobile_number));
    }
    if (platform_fee !== undefined) {
      await db.updateSetting('platform_fee', String(platform_fee));
    }
    if (default_duration !== undefined) {
      await db.updateSetting('default_duration', String(default_duration));
    }
    if (default_installment !== undefined) {
      await db.updateSetting('default_installment', String(default_installment));
    }

    return res.status(200).json({ message: 'Settings updated successfully.' });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
};

export const updateUpiQr = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a QR code image.' });
    }

    let upi_qr_url = null;
    try {
      upi_qr_url = await uploadToCloudinary(req.file.path);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (err) {
      console.error('Cloudinary QR upload failed, using local path:', err);
      upi_qr_url = `/uploads/qr/${req.file.filename}`;
    }

    await db.updateSetting('upi_qr_url', upi_qr_url);

    return res.status(200).json({
      message: 'UPI QR Code updated successfully.',
      upi_qr_url
    });
  } catch (error: any) {
    console.error('Failed to update QR setting:', error);
    return res.status(500).json({ error: 'Failed to save QR code setting.' });
  }
};

export const approveForeclosure = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    const installments = await db.getInstallmentsByLoanId(id);
    const now = new Date().toISOString();
    
    // Mark all unpaid/pending installments as Paid
    for (const inst of installments) {
      if (inst.status !== 'Paid') {
        await db.markInstallmentPaid(inst.id, now);
      }
    }

    // Update loan status to Completed
    const updatedLoan = await db.updateLoanStatus(id, 'Completed', {
      remaining_balance: 0,
      completion_date: now
    });

    await db.createNotification(
      loan.customer_id,
      'Loan Foreclosed Successfully! 🔒',
      `Your foreclosure request for loan ₹${loan.approved_amount} has been approved. The loan is now closed.`,
      'loan'
    );

    return res.status(200).json({
      message: 'Foreclosure approved and loan closed successfully.',
      loan: updatedLoan
    });
  } catch (error: any) {
    console.error('Approve foreclosure error:', error);
    return res.status(500).json({ error: 'Failed to approve foreclosure.' });
  }
};

export const updateLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const loan = await db.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan request not found.' });
    }

    const { approved_amount, platform_charges, daily_installment, duration_days, total_repayment, remaining_balance } = req.body;

    const updates: any = {};
    if (approved_amount !== undefined) updates.approved_amount = Number(approved_amount);
    if (platform_charges !== undefined) {
      updates.platform_charges = Number(platform_charges);
      const appAmt = approved_amount !== undefined ? Number(approved_amount) : loan.approved_amount;
      updates.amount_disbursed = appAmt - Number(platform_charges);
    }
    if (daily_installment !== undefined) updates.daily_installment = Number(daily_installment);
    if (duration_days !== undefined) updates.duration_days = Number(duration_days);
    if (total_repayment !== undefined) updates.total_repayment = Number(total_repayment);
    if (remaining_balance !== undefined) updates.remaining_balance = Number(remaining_balance);

    const updatedLoan = await db.updateLoanStatus(id, loan.status, updates);

    // If active and duration/daily_installment was updated, regenerate the unpaid installments
    if (loan.status === 'Active' && (duration_days !== undefined || daily_installment !== undefined)) {
      const existingInstallments = await db.getInstallmentsByLoanId(id);
      const paidOrPending = existingInstallments.filter((inst: any) => inst.status === 'Paid' || inst.status === 'Pending');

      // Delete unpaid ones
      await db.deleteUnpaidInstallments(id);

      // Re-generate unpaid ones
      const remainingCount = Math.max(0, updatedLoan.duration_days - paidOrPending.length);
      if (remainingCount > 0) {
        const newInstallments = [];
        const now = new Date().toISOString();
        const startDate = new Date();
        for (let i = 1; i <= remainingCount; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(startDate.getDate() + i);
          newInstallments.push({
            id: crypto.randomUUID(),
            loan_id: id,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'Unpaid',
            payment_date: null,
            created_at: now
          });
        }
        await db.createInstallments(newInstallments);
      }
    }

    return res.status(200).json({
      message: 'Loan updated successfully.',
      loan: updatedLoan
    });
  } catch (error: any) {
    console.error('Update loan error:', error);
    return res.status(500).json({ error: 'Failed to update loan details.' });
  }
};

export const getPendingPayments = async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.getPendingPayments();
    return res.status(200).json(list);
  } catch (error: any) {
    console.error('Get pending payments error:', error);
    return res.status(500).json({ error: 'Failed to load pending payments.' });
  }
};

export const rejectInstallment = async (req: AuthRequest, res: Response) => {
  try {
    const { installmentId } = req.body;
    if (!installmentId) {
      return res.status(400).json({ error: 'Installment ID is required.' });
    }

    const installment = await db.getInstallmentById(installmentId);
    if (!installment) {
      return res.status(404).json({ error: 'Installment not found.' });
    }

    const loan = await db.getLoanById(installment.loan_id);
    if (!loan) {
      return res.status(404).json({ error: 'Associated loan not found.' });
    }

    // Revert status to Unpaid
    const updatedInst = await db.rejectInstallmentProof(installmentId);

    // Notify customer
    await db.createNotification(
      loan.customer_id,
      'Payment Proof Rejected',
      `Your payment proof for installment due on ${installment.due_date} of ₹${loan.daily_installment} was rejected. Please submit a valid transaction ID or contact admin.`,
      'payment'
    );

    return res.status(200).json({
      message: 'Installment payment proof rejected.',
      installment: updatedInst
    });
  } catch (error: any) {
    console.error('Reject installment error:', error);
    return res.status(500).json({ error: 'Failed to reject installment payment proof.' });
  }
};

export const getOverduePayments = async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.getOverduePayments();
    return res.status(200).json(list);
  } catch (error: any) {
    console.error('Get overdue payments error:', error);
    return res.status(500).json({ error: 'Failed to load overdue payments.' });
  }
};

