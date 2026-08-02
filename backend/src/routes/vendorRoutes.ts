import { Router } from 'express';
import { updateVendorProfile, uploadKYCDocument, searchLenders } from '../controllers/vendorController';
import { authenticateUser, authorizeRoles } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.put('/profile', authenticateUser, authorizeRoles('VENDOR'), asyncHandler(updateVendorProfile));
router.post('/kyc', authenticateUser, authorizeRoles('VENDOR'), asyncHandler(uploadKYCDocument));
router.get('/lenders/search', authenticateUser, asyncHandler(searchLenders));

export default router;
