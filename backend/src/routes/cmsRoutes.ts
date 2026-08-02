import { Router } from 'express';
import {
  getBanners,
  getFAQs,
  getBlogs,
  getBlogBySlug,
  getTestimonials,
  getCMSPage,
  getPlatformSettings,
  createSupportTicket,
  getMyNotifications,
} from '../controllers/cmsController';
import { authenticateUser } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.get('/banners', asyncHandler(getBanners));
router.get('/faqs', asyncHandler(getFAQs));
router.get('/blogs', asyncHandler(getBlogs));
router.get('/blogs/:slug', asyncHandler(getBlogBySlug));
router.get('/testimonials', asyncHandler(getTestimonials));
router.get('/pages/:key', asyncHandler(getCMSPage));
router.get('/settings', asyncHandler(getPlatformSettings));

router.post('/tickets', authenticateUser, asyncHandler(createSupportTicket));
router.get('/notifications', authenticateUser, asyncHandler(getMyNotifications));

export default router;
