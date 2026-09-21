import { Router } from 'express';
import authRoutes from './authRoutes';
import vendorRoutes from './vendorRoutes';
import lenderRoutes from './lenderRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import cmsRoutes from './cmsRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';
import referralRoutes from './referralRoutes';
import loanRoutes from './loanRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/lenders', lenderRoutes);
router.use('/loans', loanRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/referrals', referralRoutes);
router.use('/cms', cmsRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;
