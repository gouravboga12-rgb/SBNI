import { Router } from 'express';
import {
  getAdminDashboardStats,
  getAllVendors,
  updateVendorKYCStatus,
  getAllLenders,
  updateLenderVerificationStatus,
  createBanner,
  deleteBanner,
  createFAQ,
  deleteFAQ,
  getAllSupportTickets,
  resolveSupportTicket,
  getAuditLogs,
  updatePlatformSetting,
} from '../controllers/adminController';
import { authenticateUser, authorizeRoles } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Protect all admin routes with authentication and SUPER_ADMIN role requirement
router.use(authenticateUser, authorizeRoles('SUPER_ADMIN'));

router.get('/dashboard-stats', asyncHandler(getAdminDashboardStats));

// Vendors & Lenders
router.get('/vendors', asyncHandler(getAllVendors));
router.put('/vendors/:vendorId/kyc', asyncHandler(updateVendorKYCStatus));
router.get('/lenders', asyncHandler(getAllLenders));
router.put('/lenders/:lenderId/verification', asyncHandler(updateLenderVerificationStatus));

// Banners & FAQs
router.post('/banners', asyncHandler(createBanner));
router.delete('/banners/:id', asyncHandler(deleteBanner));
router.post('/faqs', asyncHandler(createFAQ));
router.delete('/faqs/:id', asyncHandler(deleteFAQ));

// Support & Audits & Settings
router.get('/tickets', asyncHandler(getAllSupportTickets));
router.put('/tickets/:ticketId/resolve', asyncHandler(resolveSupportTicket));
router.get('/audit-logs', asyncHandler(getAuditLogs));
router.post('/settings', asyncHandler(updatePlatformSetting));

export default router;
