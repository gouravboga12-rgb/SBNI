import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

export const registerUser = async (req: Request, res: Response) => {
  const { email, phone, password, role, name } = req.body;

  if (!email || !phone || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please provide email, phone, password and role.' });
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });

  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email or phone already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      role: role as Role,
      otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  // Create empty default profile based on role
  if (role === 'VENDOR') {
    await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        businessName: name || 'My Enterprise Business',
        ownerName: name || 'Business Owner',
        address: '123 Commercial Belt',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    });
  } else if (role === 'LENDER') {
    await prisma.lenderProfile.create({
      data: {
        userId: user.id,
        institutionName: name || 'Financial Institution',
        institutionType: 'NBFC',
        registrationNumber: 'REG-' + Math.floor(100000 + Math.random() * 900000),
        loanCategories: JSON.stringify(['Business Loan', 'MSME Working Capital']),
        address: 'Financial Center',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        contactPersonName: name || 'Lending Officer',
      },
    });
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeRefreshToken: refreshToken },
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Verification OTP generated.',
    otpCode, // Returned for testing convenience
    data: {
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role, isVerified: user.isVerified },
      accessToken,
      refreshToken,
    },
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { vendorProfile: true, lenderProfile: true },
  });

  if (!user || user.isDeleted) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or user does not exist.' });
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
