import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { register, login, getProfile, forgotPassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Multer storage setup for Aadhaar card uploads
const uploadDir = path.resolve(__dirname, '../../uploads/aadhaar');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `aadhaar-${uniqueSuffix}${ext}`);
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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

import { db } from '../config/db';

router.post('/register', upload.single('aadhaar'), register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.post('/forgot-password', forgotPassword);

router.get('/test-supabase', async (req, res) => {
  try {
    const dummyMobile = '0000000000';
    console.log('Testing Supabase query/insert with dummy user...');
    const existing = await db.getUserByMobile(dummyMobile);
    
    let result;
    if (!existing) {
      result = await db.createUser({
        full_name: 'Test Supabase User',
        mobile_number: dummyMobile,
        email: 'test@supabase.com',
        password_hash: 'dummyhash',
        role: 'customer',
        status: 'pending'
      });
    } else {
      result = { message: 'Test user already exists', user: existing };
    }
    
    res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error('Supabase test route failed:', error);
    res.status(500).json({ success: false, error: error.message || error });
  }
});

export default router;
