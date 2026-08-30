import { Router } from 'express';
import authRoutes from './authRoutes';
import vendorRoutes from './vendorRoutes';
import lenderRoutes from './lenderRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import cmsRoutes from './cmsRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';
import referralRoutes from './referralRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/lenders', lenderRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/referrals', referralRoutes);
router.use('/cms', cmsRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;
