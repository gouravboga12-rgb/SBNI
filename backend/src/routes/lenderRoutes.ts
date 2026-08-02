import { Router } from 'express';
import { updateLenderProfile, getVendorProfiles, verifyVendorKYC } from '../controllers/lenderController';
import { authenticateUser, authorizeRoles } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.put('/profile', authenticateUser, authorizeRoles('LENDER'), asyncHandler(updateLenderProfile));
router.get('/vendors', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(getVendorProfiles));
router.post('/kyc/verify', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(verifyVendorKYC));

export default router;
