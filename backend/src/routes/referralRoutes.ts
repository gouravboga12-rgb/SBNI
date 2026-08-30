import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getMyReferralInfo,
  getMyWallet,
  getAdminReferrals,
  getPlanReferralRules,
  updatePlanReferralRule,
} from '../controllers/referralController';
import { authenticateUser, authorizeRoles } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// User endpoints (Authenticated)
router.get('/my-info', authenticateUser, asyncHandler(getMyReferralInfo));
router.get('/wallet', authenticateUser, asyncHandler(getMyWallet));

// Admin endpoints (Admin role required)
router.get('/admin/list', authenticateUser, authorizeRoles(Role.SUPER_ADMIN), asyncHandler(getAdminReferrals));
router.get('/admin/plan-rules', authenticateUser, authorizeRoles(Role.SUPER_ADMIN), asyncHandler(getPlanReferralRules));
router.put('/admin/plan-rules/:planId', authenticateUser, authorizeRoles(Role.SUPER_ADMIN), asyncHandler(updatePlanReferralRule));

export default router;
