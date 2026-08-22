import { Router } from 'express';
import {
  getAdminDashboardStats,
  getAllVendors,
  updateVendorKYCStatus,
  updateVendorFraudStatus,
  updateVendorDetails,
  getAllLenders,
  updateLenderVerificationStatus,
  updateLenderDetails,
  deleteUser,
  grantManualSubscription,
  createSubscriptionPlanAdmin,
  updateSubscriptionPlanAdmin,
  deleteSubscriptionPlanAdmin,
  createBanner,
  deleteBanner,
  createFAQ,
  deleteFAQ,
  getAllSupportTickets,
  resolveSupportTicket,
  getAuditLogs,
  updatePlatformSetting,
  getAllPayments,
  getAllFraudReports,
  createFraudReport,
  confirmFraudReport,
  dismissFraudReport,
} from '../controllers/adminController';
import { authenticateUser, authorizeRoles, optionalAuth } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Allow any Financer or Admin to submit a fraud report with optional token
router.post('/fraud-reports', optionalAuth, asyncHandler(createFraudReport));

// Protect remaining admin routes with authentication and SUPER_ADMIN role requirement
router.use(authenticateUser, authorizeRoles('SUPER_ADMIN'));

// Fraud Reports Management
router.get('/fraud-reports', asyncHandler(getAllFraudReports));
router.put('/fraud-reports/:reportId/confirm', asyncHandler(confirmFraudReport));
router.put('/fraud-reports/:reportId/dismiss', asyncHandler(dismissFraudReport));


router.get('/dashboard-stats', asyncHandler(getAdminDashboardStats));
router.get('/payments', asyncHandler(getAllPayments));

// Account Management
router.delete('/users/:userId', asyncHandler(deleteUser));
router.post('/grant-subscription', asyncHandler(grantManualSubscription));

// Subscription Plans CRUD
router.post('/subscription-plans', asyncHandler(createSubscriptionPlanAdmin));
router.put('/subscription-plans/:planId', asyncHandler(updateSubscriptionPlanAdmin));
router.delete('/subscription-plans/:planId', asyncHandler(deleteSubscriptionPlanAdmin));


// Vendors & Lenders
router.get('/vendors', asyncHandler(getAllVendors));
router.put('/vendors/:vendorId/kyc', asyncHandler(updateVendorKYCStatus));
router.put('/vendors/:vendorId/fraud', asyncHandler(updateVendorFraudStatus));
router.put('/vendors/:vendorId', asyncHandler(updateVendorDetails));
router.delete('/vendors/:vendorId', asyncHandler(deleteUser));

router.get('/lenders', asyncHandler(getAllLenders));
router.put('/lenders/:lenderId/verification', asyncHandler(updateLenderVerificationStatus));
router.put('/lenders/:lenderId', asyncHandler(updateLenderDetails));
router.delete('/lenders/:lenderId', asyncHandler(deleteUser));

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

