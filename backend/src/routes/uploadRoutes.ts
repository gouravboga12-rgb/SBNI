import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { authenticateUser } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// Allow authenticated users to upload files (and also public uploads for signup forms)
router.post('/', asyncHandler(uploadFile));
router.post('/secure', authenticateUser, asyncHandler(uploadFile));

export default router;
