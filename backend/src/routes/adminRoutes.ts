import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getCustomers,
  createCustomer,
  updateCustomerStatus,
  editCustomerDetails,
  getCustomerDetails,
  uploadCustomerAadhaar,
  uploadCustomerAvatar,
  getLoans,
  createLoan,
  approveLoan,
  rejectLoan,
  closeLoan,
  getLoanDetails,
  markInstallmentPaid,
  getDashboardStats,
  getReports,
  getSettings,
  updateUpiQr,
  updateSettings,
  approveForeclosure,
  updateLoan,
  getPendingPayments,
  rejectInstallment
} from '../controllers/adminController';

const uploadDir = process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../../uploads/aadhaar');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create admin upload directory:', e);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      const dir = process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../../uploads/avatar');
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      } catch (e) {
        console.warn('Could not create avatar directory:', e);
      }
      cb(null, dir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    if (file.fieldname === 'avatar') {
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    } else {
      cb(null, `aadhaar-${uniqueSuffix}${ext}`);
    }
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

// Apply auth and admin check middleware to all admin endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// Customer Management
router.get('/customers', getCustomers);
router.post('/customers', upload.fields([{ name: 'aadhaar', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), createCustomer);
router.get('/customers/:id', getCustomerDetails);
router.patch('/customers/:id/status', updateCustomerStatus);
router.put('/customers/:id', editCustomerDetails);
router.post('/customers/:id/aadhaar', upload.single('aadhaar'), uploadCustomerAadhaar);
router.post('/customers/:id/avatar', upload.single('avatar'), uploadCustomerAvatar);

// Loan Management
router.get('/loans', getLoans);
router.post('/loans', createLoan);
router.get('/loans/:id', getLoanDetails);
router.post('/loans/:id/approve', approveLoan);
router.post('/loans/:id/reject', rejectLoan);
router.post('/loans/:id/close', closeLoan);
router.post('/loans/:id/approve-foreclosure', approveForeclosure);
router.put('/loans/:id', updateLoan);

// Payment Tracking
router.post('/payments/mark-paid', markInstallmentPaid);
router.post('/payments/reject', rejectInstallment);

// Settings Configuration
const qrUploadDir = process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../../uploads/qr');
try {
  if (!fs.existsSync(qrUploadDir)) {
    fs.mkdirSync(qrUploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create admin qr upload directory:', e);
}

const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, qrUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `qr-${uniqueSuffix}${ext}`);
  }
});

const uploadQr = multer({ 
  storage: qrStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.post('/settings/upi-qr', uploadQr.single('qr'), updateUpiQr);

// Reports & Statistics
router.get('/dashboard-stats', getDashboardStats);
router.get('/pending-payments', getPendingPayments);
router.get('/reports', getReports);

export default router;
