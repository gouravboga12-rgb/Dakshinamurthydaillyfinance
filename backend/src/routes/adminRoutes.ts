import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getCustomers,
  createCustomer,
  updateCustomerStatus,
  editCustomerDetails,
  getCustomerDetails,
  getLoans,
  createLoan,
  approveLoan,
  rejectLoan,
  closeLoan,
  getLoanDetails,
  markInstallmentPaid,
  getDashboardStats,
  getReports
} from '../controllers/adminController';

const router = Router();

// Apply auth and admin check middleware to all admin endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// Customer Management
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.get('/customers/:id', getCustomerDetails);
router.patch('/customers/:id/status', updateCustomerStatus);
router.put('/customers/:id', editCustomerDetails);

// Loan Management
router.get('/loans', getLoans);
router.post('/loans', createLoan);
router.get('/loans/:id', getLoanDetails);
router.post('/loans/:id/approve', approveLoan);
router.post('/loans/:id/reject', rejectLoan);
router.post('/loans/:id/close', closeLoan);

// Payment Tracking
router.post('/payments/mark-paid', markInstallmentPaid);

// Reports & Statistics
router.get('/dashboard-stats', getDashboardStats);
router.get('/reports', getReports);

export default router;
