import { Router } from 'express';
import {
  updateLenderProfile,
  getVendorProfiles,
  verifyVendorKYC,
  ingestLead,
  getLenderLeads,
  updateLeadStatus,
} from '../controllers/lenderController';
import { createFraudReport } from '../controllers/adminController';
import { authenticateUser, authorizeRoles, optionalAuth } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.put('/profile', authenticateUser, authorizeRoles('LENDER'), asyncHandler(updateLenderProfile));
router.get('/vendors', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(getVendorProfiles));
router.post('/kyc/verify', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(verifyVendorKYC));

// Lead ingestion (public / authenticated vendor can trigger leads upon Apply, Call, WhatsApp)
router.post('/leads', optionalAuth, asyncHandler(ingestLead));
router.get('/leads', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(getLenderLeads));
router.put('/leads/:leadId/status', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(updateLeadStatus));

// Fraud report from Lender
router.post('/fraud-reports', authenticateUser, authorizeRoles('LENDER', 'SUPER_ADMIN'), asyncHandler(createFraudReport));

export default router;

