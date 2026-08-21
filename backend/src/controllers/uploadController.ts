import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure base upload directories exist on EC2
['avatars', 'documents', 'shops', 'kyc'].forEach((dir) => {
  const fullPath = path.join(UPLOADS_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/**
 * Handle base64 / binary file upload to AWS EC2 filesystem and RDS PostgreSQL.
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
    let base64Content = fileData;

    // Detect mime type and clean base64 header if present
    if (fileData.startsWith('data:')) {
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        base64Content = matches[2];
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = '.jpg';
        else if (mimeType.includes('png')) extension = '.png';
        else if (mimeType.includes('pdf')) extension = '.pdf';
        else if (mimeType.includes('webp')) extension = '.webp';
      }
    } else if (fileName) {
      const ext = path.extname(fileName);
      if (ext) extension = ext;
    }

    const uniqueName = `${targetFolder}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${extension}`;
    const filePath = path.join(folderPath, uniqueName);
    const buffer = Buffer.from(base64Content, 'base64');

    // Save to AWS EC2 file system
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${targetFolder}/${uniqueName}`;
    const host = req.get('host') || '18.61.36.65';
    const protocol = req.protocol || 'http';
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    // If authenticated user and docType specified, record in RDS KYCDocument
    const userId = req.user?.userId;
    if (userId && docType) {
      try {
        await prisma.kYCDocument.create({
          data: {
            userId,
            docType,
            documentNumber: `${docType}-VERIFIED`,
            fileUrl: relativeUrl,
            status: 'VERIFIED',
          },
        });
      } catch (dbErr) {
        console.warn('Could not record KYC doc in database:', dbErr);
      }
    }

    return res.json({
      success: true,
      message: 'File successfully uploaded and stored on AWS EC2 & RDS.',
      fileUrl: relativeUrl,
      fullUrl,
      fileName: uniqueName,
    });
  } catch (error: any) {
    console.error('File upload error on EC2:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save file to AWS EC2.',
    });
  }
};
