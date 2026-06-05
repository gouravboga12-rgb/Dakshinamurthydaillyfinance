import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../config/cloudinary';
import { sendOtpEmail } from '../config/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'madur_foods_771892348_purity_secure';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// In-memory OTP cache storage: { [email]: { otp: string, expiresAt: number } }
const otpCache: { [email: string]: { otp: string; expiresAt: number } } = {};

export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email already exists in users database
    const existingUser = await db.getUserByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache with 5 minute expiration
    otpCache[trimmedEmail] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    };

    console.log(`Generated OTP for ${trimmedEmail}: ${otp}`);

    // Send OTP via Email
    const emailSent = await sendOtpEmail(trimmedEmail, otp);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP email. Please verify SMTP settings.' });
    }

    return res.status(200).json({ message: 'OTP sent successfully to your email.' });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      mobile_number,
      email,
      occupation,
      shop_name,
      address,
      password,
      confirm_password,
      otp
    } = req.body;

    // Check password match
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check mandatory fields
    if (!full_name || !mobile_number || !email || !password || !otp) {
      return res.status(400).json({ error: 'Name, Mobile Number, Email, Password, and OTP are required.' });
    }

    // Validate OTP
    const trimmedEmail = email.trim().toLowerCase();
    const cachedOtpObj = otpCache[trimmedEmail];

    if (!cachedOtpObj) {
      return res.status(400).json({ error: 'No OTP requested for this email. Please request a code first.' });
    }

    if (cachedOtpObj.expiresAt < Date.now()) {
      delete otpCache[trimmedEmail];
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (cachedOtpObj.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
    }

    // OTP is correct! Clear it from cache
    delete otpCache[trimmedEmail];

    // Check duplicate mobile
    const existingUser = await db.getUserByMobile(mobile_number);
    if (existingUser) {
      return res.status(400).json({ error: 'Mobile number is already registered.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Upload Aadhaar to Cloudinary if provided
    let aadhaar_url = null;
    if (req.file) {
      try {
        aadhaar_url = await uploadToCloudinary(req.file.path);
        // Delete local temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Error uploading to Cloudinary, falling back to local storage:', err);
        aadhaar_url = `/uploads/aadhaar/${req.file.filename}`;
      }
    }

    // Create user — auto-approved so they can login immediately
    const newUser = await db.createUser({
      full_name,
      mobile_number,
      email: trimmedEmail,
      occupation,
      shop_name,
      address,
      password_hash,
      role: 'customer',
      status: 'approved',
      aadhaar_url
    });

    // Create a system notification for admins
    console.log(`New registration requested: ${full_name} (${mobile_number})`);

    return res.status(201).json({
      message: 'Registration successful! You can now login.',
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        mobile_number: newUser.mobile_number,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { mobile_number, password } = req.body;

    if (!mobile_number || !password) {
      return res.status(400).json({ error: 'Mobile number or email, and password are required.' });
    }

    let user = null;
    if (mobile_number.includes('@')) {
      user = await db.getUserByEmail(mobile_number);
    } else {
      user = await db.getUserByMobile(mobile_number);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check status
    if (user.status === 'pending' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Your account is pending admin approval. You cannot login yet.' });
    }
    if (user.status === 'deactivated') {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Your registration request was rejected.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE as any }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        mobile_number: user.mobile_number,
        email: user.email,
        role: user.role,
        status: user.status,
        occupation: user.occupation,
        shop_name: user.shop_name,
        address: user.address
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const user = await db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    // Remove password hash from response
    const { password_hash, ...profile } = user;
    return res.status(200).json(profile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { mobile_number, new_password } = req.body;
    if (!mobile_number || !new_password) {
      return res.status(400).json({ error: 'Email/Mobile and new password are required.' });
    }

    let user = null;
    if (mobile_number.includes('@')) {
      user = await db.getUserByEmail(mobile_number);
    } else {
      user = await db.getUserByMobile(mobile_number);
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found for the provided email/mobile.' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await db.updateUser(user.id, { password_hash });

    return res.status(200).json({ message: 'Password reset successful. You can now login.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const userId = req.user.id;
    const { occupation, shop_name, address } = req.body;

    const updateFields: any = {};
    if (occupation !== undefined) updateFields.occupation = occupation;
    if (shop_name !== undefined) updateFields.shop_name = shop_name;
    if (address !== undefined) updateFields.address = address;

    // Handle avatar upload if present
    if (req.file) {
      try {
        const avatar_url = await uploadToCloudinary(req.file.path);
        updateFields.avatar_url = avatar_url;
        // Delete local temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Error uploading avatar to Cloudinary, falling back to local storage:', err);
        updateFields.avatar_url = `/uploads/avatar/${req.file.filename}`;
      }
    }

    // Update user in DB
    const updatedUser = await db.updateUser(userId, updateFields);

    // Remove password hash from response
    const { password_hash, ...profile } = updatedUser;

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: profile
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

