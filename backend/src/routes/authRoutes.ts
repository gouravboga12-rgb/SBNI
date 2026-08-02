import { Router } from 'express';
import { registerUser, loginUser, verifyOTP, refreshAccessToken, getMyProfile } from '../controllers/authController';
import { authenticateUser } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));
router.post('/verify-otp', asyncHandler(verifyOTP));
router.post('/refresh-token', asyncHandler(refreshAccessToken));
router.get('/me', authenticateUser, asyncHandler(getMyProfile));

export default router;
