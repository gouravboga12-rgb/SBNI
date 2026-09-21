import { Router } from 'express';
import { ingestLead } from '../controllers/lenderController';
import { getVendorMyLeads } from '../controllers/vendorController';
import { authenticateUser, authorizeRoles, optionalAuth } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Backward compatibility alias for Loan Enquiries / Leads
router.post('/request', optionalAuth, asyncHandler(ingestLead));
router.get('/my-requests', authenticateUser, authorizeRoles('VENDOR'), asyncHandler(getVendorMyLeads));

export default router;
