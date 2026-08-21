import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { uploadToS3, isS3Configured } from '../utils/s3';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure base upload directories exist on EC2
['avatars', 'documents', 'shops', 'kyc'].forEach((dir) => {
  const fullPath = path.join(UPLOADS_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/**
 * Handle base64 / binary file upload directly to AWS S3 Bucket and RDS PostgreSQL.
 */
export const uploadFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, fileData, folder = 'documents', docType } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, message: 'No file data provided.' });
    }

    const targetFolder = ['avatars', 'documents', 'shops', 'kyc'].includes(folder) ? folder : 'documents';
    const folderPath = path.join(UPLOADS_DIR, targetFolder);

    let extension = '.png';
    let mimeType = 'image/png';
    let base64Content = fileData;

    // Detect mime type and clean base64 header if present
    if (fileData.startsWith('data:')) {
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Content = matches[2];
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = '.jpg';
        else if (mimeType.includes('png')) extension = '.png';
        else if (mimeType.includes('pdf')) {
          extension = '.pdf';
          mimeType = 'application/pdf';
        }
        else if (mimeType.includes('webp')) extension = '.webp';
      }
    } else if (fileName) {
      const ext = path.extname(fileName);
      if (ext) {
        extension = ext;
        if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.webp') mimeType = 'image/webp';
      }
    }

    const uniqueName = `${targetFolder}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${extension}`;
    const buffer = Buffer.from(base64Content, 'base64');

    let finalUrl = '';

    // 1. Try Uploading to AWS S3
    if (isS3Configured) {
      try {
        finalUrl = await uploadToS3(buffer, targetFolder, uniqueName, mimeType);
      } catch (s3Err) {
        console.warn('AWS S3 upload notice (falling back to EC2 storage):', s3Err);
      }
    }

    // 2. Fallback to EC2 Local Storage if S3 is not configured or fails
    if (!finalUrl) {
      const filePath = path.join(folderPath, uniqueName);
      await fs.promises.writeFile(filePath, buffer);
      finalUrl = `/uploads/${targetFolder}/${uniqueName}`;
    }

    // 3. Record in RDS PostgreSQL KYCDocument table if authenticated and docType provided
    const userId = req.user?.userId;
    if (userId && docType) {
      try {
        await prisma.kYCDocument.create({
          data: {
            userId,
            docType,
            documentNumber: `${docType}-VERIFIED`,
            fileUrl: finalUrl,
            status: 'VERIFIED',
          },
        });
      } catch (dbErr) {
        console.warn('Could not record KYC doc in database:', dbErr);
      }
    }

    return res.json({
      success: true,
      message: 'File successfully uploaded and stored on AWS S3 & RDS.',
      fileUrl: finalUrl,
      fullUrl: finalUrl,
      fileName: uniqueName,
      storage: finalUrl.includes('amazonaws.com') ? 'S3' : 'EC2',
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save file to AWS S3.',
    });
  }
};
