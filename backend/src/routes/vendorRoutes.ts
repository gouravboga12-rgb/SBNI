import { Router } from 'express';
import { updateVendorProfile, uploadKYCDocument, searchLenders } from '../controllers/vendorController';
import { authenticateUser, authorizeRoles, optionalAuth } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.put('/profile', authenticateUser, authorizeRoles('VENDOR'), asyncHandler(updateVendorProfile));
router.post('/kyc', authenticateUser, authorizeRoles('VENDOR'), asyncHandler(uploadKYCDocument));

// Public lender search (optionalAuth: subscribed users get unlocked contacts)
router.get('/lenders/search', optionalAuth, asyncHandler(searchLenders));

export default router;
