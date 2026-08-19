import { Router } from 'express';
import {
  registerUser,
  loginUser,
  sendSignupOtp,
  verifySignupOtp,
  forgotPasswordRequest,
  resetPasswordWithOtp,
  resendOtp,
  verifyOTP,
  refreshAccessToken,
  getMyProfile,
} from '../controllers/authController';
import { authenticateUser } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Sign Up & OTP Verification Routes
router.post('/send-signup-otp', asyncHandler(sendSignupOtp));
router.post('/verify-signup-otp', asyncHandler(verifySignupOtp));
router.post('/register', asyncHandler(registerUser));

// Login & Forgot Password Routes
router.post('/login', asyncHandler(loginUser));
router.post('/forgot-password', asyncHandler(forgotPasswordRequest));
router.post('/reset-password', asyncHandler(resetPasswordWithOtp));
router.post('/resend-otp', asyncHandler(resendOtp));

// Legacy & Session Routes
router.post('/verify-otp', asyncHandler(verifyOTP));
router.post('/refresh-token', asyncHandler(refreshAccessToken));
router.get('/me', authenticateUser, asyncHandler(getMyProfile));

export default router;
