import { Router } from 'express';
import { authenticateToken, requireCustomer } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getCustomerDashboard,
  getLoanDetails,
  getLoanHistory,
  getNotifications,
  markNotificationAsRead,
  requestLoan,
  payInstallment,
  getSettings,
  submitPaymentProof
} from '../controllers/customerController';

// Multer storage setup for payment proofs
const proofUploadDir = path.resolve(__dirname, '../../uploads/proof');
if (!fs.existsSync(proofUploadDir)) {
  fs.mkdirSync(proofUploadDir, { recursive: true });
}

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proofUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, and JPEG are allowed.'));
  }
};

const uploadProof = multer({
  storage: proofStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// Apply auth and customer checks to all customer endpoints
router.use(authenticateToken);
router.use(requireCustomer);

router.get('/dashboard', getCustomerDashboard);
router.get('/loans', getLoanHistory);
router.get('/loans/:id', getLoanDetails);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.get('/settings', getSettings);

router.post('/request-loan', requestLoan);
router.post('/pay', payInstallment);
router.post('/pay-proof', uploadProof.single('proof'), submitPaymentProof);

export default router;
