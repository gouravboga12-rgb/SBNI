import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'justpaisa-media-storage-vault';
const region = process.env.AWS_S3_REGION || 'ap-south-2';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

export const isS3Configured = Boolean(bucketName && accessKeyId && secretAccessKey);

export const s3Client = isS3Configured
  ? new S3Client({
      region,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

/**
 * Uploads a buffer directly to AWS S3 bucket and returns the permanent HTTPS URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  folder: string,
  fileName: string,
  contentType: string = 'image/png'
): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('AWS S3 client is not configured.');
  }

  const key = `${folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return permanent direct HTTPS URL from S3
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
