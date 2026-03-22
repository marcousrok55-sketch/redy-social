import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import logger from '../utils/logger.js';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files at once
  }
});

// Upload to cloud storage (S3, Cloudinary, etc.)
export async function uploadToCloud(filePath, options = {}) {
  const { provider = 'local' } = options;
  
  try {
    switch (provider) {
      case 's3':
        return await uploadToS3(filePath, options);
      case 'cloudinary':
        return await uploadToCloudinary(filePath, options);
      default:
        return await uploadToLocal(filePath, options);
    }
  } catch (error) {
    logger.error('Upload error:', error);
    throw error;
  }
}

// Local file handling
async function uploadToLocal(filePath, options = {}) {
  const { publicUrl } = options;
  
  return {
    url: publicUrl || `/uploads/${path.basename(filePath)}`,
    path: filePath,
    provider: 'local'
  };
}

// S3 upload (placeholder - add AWS SDK in production)
async function uploadToS3(filePath, options = {}) {
  const { bucket = process.env.AWS_BUCKET_NAME } = options;
  
  // TODO: Implement actual S3 upload
  logger.info(`Would upload ${filePath} to S3 bucket ${bucket}`);
  
  return {
    url: `https://${bucket}.s3.amazonaws.com/${path.basename(filePath)}`,
    path: filePath,
    provider: 's3'
  };
}

// Cloudinary upload (placeholder - add Cloudinary SDK in production)
async function uploadToCloudinary(filePath, options = {}) {
  const { folder = 'redy-social' } = options;
  
  // TODO: Implement actual Cloudinary upload
  logger.info(`Would upload ${filePath} to Cloudinary folder ${folder}`);
  
  return {
    url: `https://res.cloudinary.com/demo/image/upload/${path.basename(filePath)}`,
    path: filePath,
    provider: 'cloudinary'
  };
}

// Delete file
export async function deleteFile(filePath, provider = 'local') {
  try {
    if (provider === 'local') {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted local file: ${filePath}`);
      }
    } else {
      // TODO: Implement cloud deletion
      logger.info(`Would delete ${filePath} from ${provider}`);
    }
  } catch (error) {
    logger.error('Delete file error:', error);
    throw error;
  }
}

// Process image (resize, compress)
export async function processImage(filePath, operations = {}) {
  const { width, height, quality = 80 } = operations;
  
  try {
    // Using sharp for image processing
    const sharp = (await import('sharp')).default;
    
    let pipeline = sharp(filePath);
    
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    const outputPath = filePath.replace(/(\.\w+)$/, `_processed$1`);
    
    await pipeline
      .jpeg({ quality })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    logger.error('Image processing error:', error);
    throw error;
  }
}

// Generate thumbnail
export async function generateThumbnail(filePath, size = 200) {
  try {
    const sharp = (await import('sharp')).default;
    
    const thumbnailPath = filePath.replace(/(\.\w+)$/, `_thumb$1`);
    
    await sharp(filePath)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre'
      })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    logger.error('Thumbnail generation error:', error);
    throw error;
  }
}

// Validate file
export function validateFile(file) {
  const errors = [];
  
  // Check file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('File type not supported');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  upload,
  uploadToCloud,
  deleteFile,
  processImage,
  generateThumbnail,
  validateFile
};
