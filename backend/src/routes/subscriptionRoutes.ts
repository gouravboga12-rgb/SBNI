import { Router } from 'express';
import {
  getSubscriptionPlans,
  purchaseSubscriptionPlan,
  getMyActiveSubscription,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayConfig,
} from '../controllers/subscriptionController';
import { authenticateUser } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.get('/plans', asyncHandler(getSubscriptionPlans));
router.get('/razorpay-key', asyncHandler(getRazorpayConfig));
router.post('/create-order', authenticateUser, asyncHandler(createRazorpayOrder));
router.post('/verify-payment', authenticateUser, asyncHandler(verifyRazorpayPayment));
router.post('/purchase', authenticateUser, asyncHandler(purchaseSubscriptionPlan));
router.get('/active', authenticateUser, asyncHandler(getMyActiveSubscription));
router.get('/status', authenticateUser, asyncHandler(getMyActiveSubscription));

export default router;
