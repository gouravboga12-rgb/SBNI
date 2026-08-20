import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSignupOtpEmail, sendForgotPasswordOtpEmail } from '../utils/mailer';

// In-memory store for pending signup OTPs (before account creation in DB)
interface PendingOtpRecord {
  otpCode: string;
  expiresAt: Date;
  name?: string;
  role?: string;
  createdAt: number;
}
const pendingSignupOtps = new Map<string, PendingOtpRecord>();

// Clean up expired OTPs periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingSignupOtps.entries()) {
    if (val.expiresAt.getTime() < now) {
      pendingSignupOtps.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * 1. SEND SIGNUP OTP
 * Sends 6-digit OTP to vendor or lender's email before registration completion
 */
export const sendSignupOtp = async (req: Request, res: Response) => {
  const { email, name, role = 'VENDOR' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser && !existingUser.isDeleted) {
    if (existingUser.role !== role) {
      const existingRoleLabel = existingUser.role === 'VENDOR' ? 'Small Shop / Local Startup Business' : 'Business Money Financer (Lender)';
      const attemptedRoleLabel = role === 'VENDOR' ? 'Small Shop / Local Startup Business' : 'Business Money Financer (Lender)';
      return res.status(400).json({
        success: false,
        message: `This email is already registered as a ${existingRoleLabel}. It cannot be registered as a ${attemptedRoleLabel}. Accounts are kept strictly separate.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: 'An account with this email address already exists. Please login instead.',
    });
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store in memory
  const normalizedEmail = email.toLowerCase().trim();
  pendingSignupOtps.set(normalizedEmail, {
    otpCode,
    expiresAt,
    name,
    role,
    createdAt: Date.now(),
  });

  // Dispatch email via JustPaisa SMTP Mailer
  const emailResult = await sendSignupOtpEmail({
    to: normalizedEmail,
    name,
    otpCode,
    role,
  });

  res.json({
    success: true,
    message: `Verification OTP has been sent to ${normalizedEmail}`,
    emailSent: emailResult.success,
    otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined, // Returned for dev testing convenience
  });
};

/**
 * 2. VERIFY SIGNUP OTP
 * Checks whether the submitted OTP for signup email is valid
 */
export const verifySignupOtp = async (req: Request, res: Response) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ success: false, message: 'Please provide email and 6-digit OTP code.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = pendingSignupOtps.get(normalizedEmail);

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No active OTP verification session found. Please request a new OTP.',
    });
  }

  if (record.expiresAt.getTime() < Date.now()) {
    pendingSignupOtps.delete(normalizedEmail);
    return res.status(400).json({
      success: false,
      message: 'OTP has expired. Please request a new OTP code.',
    });
  }

  if (record.otpCode !== otpCode.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP code. Please check the code sent to your email and try again.',
    });
  }

  // Mark record as verified (extend validity for registration submission)
  record.expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  res.json({
    success: true,
    message: 'Email address verified successfully.',
  });
};

/**
 * 3. REGISTER USER (Vendor or Lender)
 */
export const registerUser = async (req: Request, res: Response) => {
  const { email, phone, password, role, name, businessName, address, city, state, pincode, otpCode, institutionType, minLoanAmount, maxLoanAmount, lendingRadiusKm } = req.body;

  if (!email || !phone || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please provide email, phone, password and role.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If OTP was provided, verify it
  if (otpCode) {
    const record = pendingSignupOtps.get(normalizedEmail);
    if (!record || record.otpCode !== otpCode.trim() || record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired email verification OTP.' });
    }
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { phone: phone.trim() }] },
  });

  if (existingUser) {
    if (existingUser.isDeleted) {
      try {
        await prisma.user.delete({ where: { id: existingUser.id } });
      } catch (e) {}
    } else {
      if (existingUser.role !== role) {
        const existingRoleLabel = existingUser.role === 'VENDOR' ? 'Small Shop / Local Startup Business' : 'Business Money Financer (Lender)';
        const attemptedRoleLabel = role === 'VENDOR' ? 'Small Shop / Local Startup Business' : 'Business Money Financer (Lender)';
        return res.status(400).json({
          success: false,
          message: `This account is already registered as a ${existingRoleLabel}. It cannot be registered as a ${attemptedRoleLabel}.`,
        });
      }
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists.' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: role as Role,
      isVerified: true, // Verified via email OTP
      otpCode: userOtpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Create profile based on role
  if (role === 'VENDOR') {
    await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: businessName || (name ? `${name} Enterprise` : 'My Enterprise Business'),
        ownerName: name || 'Business Owner',
        address: address || '123 Commercial Belt',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        pincode: pincode || '400001',
        kycStatus: 'VERIFIED',
      },
    });
  } else if (role === 'LENDER') {
    // Build financer name: ensure it ends with "Money Financer"
    let financerName = businessName || name || 'Business Money Financer';
    if (!financerName.toLowerCase().includes('money financer')) {
      financerName = `${financerName} Money Financer`;
    }

    await prisma.lenderProfile.create({
      data: {
        userId: user.id,
        institutionName: financerName,
        institutionType: 'MONEY_FINANCER' as any,
        registrationNumber: 'REG-' + Math.floor(100000 + Math.random() * 900000),
        loanCategories: JSON.stringify(['Business Loan', 'MSME Working Capital']),
        minLoanAmount: minLoanAmount ? parseFloat(minLoanAmount) : 10000,
        maxLoanAmount: maxLoanAmount ? parseFloat(maxLoanAmount) : 100000,
        lendingRadiusKm: lendingRadiusKm ? parseFloat(lendingRadiusKm) : 50,
        address: address || 'Financial Center',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        pincode: pincode || '400001',
        contactPersonName: name || 'Lending Officer',
        verificationStatus: 'VERIFIED',
      },
    });
  }

  // Clear pending signup OTP after successful registration
  pendingSignupOtps.delete(normalizedEmail);

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeRefreshToken: refreshToken },
  });

  res.status(201).json({
    success: true,
    message: 'User registered and verified successfully.',
    data: {
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role, isVerified: user.isVerified },
      accessToken,
      refreshToken,
    },
  });
};

/**
 * 4. LOGIN USER
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
  }

  const searchVal = email.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: searchVal.toLowerCase() },
        { phone: searchVal },
      ],
    },
    include: { vendorProfile: true, lenderProfile: true },
  });

  if (!user || user.isDeleted) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or user does not exist.' });
  }

  // Strict Role Validation: Prevent cross-role login
  if (role && user.role !== (role as Role) && user.role !== Role.SUPER_ADMIN) {
    if (role === 'VENDOR' && user.role === 'LENDER') {
      return res.status(403).json({
        success: false,
        message: 'This account is registered as a Business Money Financer (Lender). Please select "Login as Financer" to log in.',
      });
    }
    if (role === 'LENDER' && user.role === 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'This account is registered as a Small Shop / Local Startup Business. Please select "Login as Shop / Startup Owner" to log in.',
      });
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. This account cannot be logged into as ${role === 'VENDOR' ? 'a Small Shop Business' : 'a Business Money Financer'}.`,
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeRefreshToken: refreshToken },
  });

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        vendorProfile: user.vendorProfile,
        lenderProfile: user.lenderProfile,
      },
      accessToken,
      refreshToken,
    },
  });
};

/**
 * 5. FORGOT PASSWORD - REQUEST OTP
 * Generates OTP and sends it via JustPaisa SMTP Mailer to user's registered email
 */
export const forgotPasswordRequest = async (req: Request, res: Response) => {
  const { emailOrPhone, role } = req.body;

  if (!emailOrPhone) {
    return res.status(400).json({ success: false, message: 'Please provide your registered Email or Mobile number.' });
  }

  const searchVal = emailOrPhone.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: searchVal.toLowerCase() },
        { phone: searchVal },
      ],
    },
    include: { vendorProfile: true, lenderProfile: true },
  });

  if (!user || user.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'No registered account found with that email or phone number.',
    });
  }

  // Strict Role Validation for Password Reset
  if (role && user.role !== (role as Role) && user.role !== Role.SUPER_ADMIN) {
    if (role === 'VENDOR' && user.role === 'LENDER') {
      return res.status(403).json({
        success: false,
        message: 'This account is registered as a Business Money Financer (Lender). Please reset password from the Financer section.',
      });
    }
    if (role === 'LENDER' && user.role === 'VENDOR') {
      return res.status(403).json({
        success: false,
        message: 'This account is registered as a Small Shop / Local Startup Business. Please reset password from the Shop Owner section.',
      });
    }
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode, otpExpiresAt },
  });

  const userName = user.vendorProfile?.ownerName || user.lenderProfile?.contactPersonName || 'User';

  // Send Password Reset OTP Email via JustPaisa SMTP
  const emailResult = await sendForgotPasswordOtpEmail({
    to: user.email,
    name: userName,
    otpCode,
    role: user.role,
  });

  const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, '$1***');

  res.json({
    success: true,
    message: `Password reset OTP has been sent to ${maskedEmail}`,
    email: user.email,
    emailSent: emailResult.success,
    otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined, // Returned in dev mode
  });
};

/**
 * 6. RESET PASSWORD WITH OTP
 * Validates OTP and sets new password
 */
export const resetPasswordWithOtp = async (req: Request, res: Response) => {
  const { email, otpCode, newPassword } = req.body;

  if (!email || !otpCode || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, 6-digit OTP code, and your new password.',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.isDeleted) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  if (!user.otpCode || user.otpCode !== otpCode.trim()) {
    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter the code sent to your email.' });
  }

  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'The OTP code has expired. Please request a new reset code.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      otpCode: null,
      otpExpiresAt: null,
    },
  });

  res.json({
    success: true,
    message: 'Password reset successful! You can now login with your new password.',
  });
};

/**
 * 7. RESEND OTP
 */
export const resendOtp = async (req: Request, res: Response) => {
  const { email, type = 'SIGNUP', role = 'VENDOR', name } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide your email address.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  if (type === 'FORGOT_PASSWORD') {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt: expiresAt },
    });
    await sendForgotPasswordOtpEmail({
      to: normalizedEmail,
      otpCode,
      name: name || 'User',
      role: user.role,
    });
  } else {
    // Signup Resend
    pendingSignupOtps.set(normalizedEmail, {
      otpCode,
      expiresAt,
      name,
      role,
      createdAt: Date.now(),
    });
    await sendSignupOtpEmail({
      to: normalizedEmail,
      otpCode,
      name,
      role,
    });
  }

  res.json({
    success: true,
    message: `A new OTP has been sent to ${normalizedEmail}`,
    otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  });
};

/**
 * Legacy Mobile OTP Verification
 */
export const verifyOTP = async (req: Request, res: Response) => {
  const { phone, otpCode } = req.body;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.otpCode !== otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otpCode: null, otpExpiresAt: null },
  });

  res.json({ success: true, message: 'Account mobile phone verified successfully.' });
};

/**
 * Refresh Access Token
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.activeRefreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Expired or invalid refresh token.' });
  }
};

/**
 * Get Profile
 */
export const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendorProfile: true,
      lenderProfile: true,
      kycDocuments: true,
      subscriptions: {
        include: { plan: true },
        where: { status: 'ACTIVE', endDate: { gte: new Date() } },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }

  const hasActiveSubscription = user.subscriptions.length > 0;

  res.json({
    success: true,
    data: {
      ...user,
      passwordHash: undefined,
      hasActiveSubscription,
    },
  });
};
