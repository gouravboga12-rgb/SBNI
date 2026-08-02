import { Router } from 'express';
import { getSubscriptionPlans, purchaseSubscriptionPlan, getMyActiveSubscription } from '../controllers/subscriptionController';
import { authenticateUser } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.get('/plans', asyncHandler(getSubscriptionPlans));
router.post('/purchase', authenticateUser, asyncHandler(purchaseSubscriptionPlan));
router.get('/active', authenticateUser, asyncHandler(getMyActiveSubscription));

export default router;
