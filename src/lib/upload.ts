import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

export interface UploadResult {
  url: string;
  filename: string;
  success: boolean;
  error?: string;
  thumbnailUrl?: string;
}

export class FileUploadService {
  private uploadDir: string;

  constructor() {
    // In production, this should be configured via environment variables
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
  }

  /**
   * Upload a file to the server with optimization
   * @param file - The file to upload
   * @param folder - The folder to store the file in (e.g., 'products', 'users')
   * @returns Promise<UploadResult>
   */
  async uploadFile(file: File, folder: string = 'general'): Promise<UploadResult> {
    try {
      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.success) {
        return { url: '', filename: '', success: false, error: validation.error };
      }

      // Create upload directory if it doesn't exist
      const folderPath = path.join(this.uploadDir, folder);
      if (!existsSync(folderPath)) {
        await mkdir(folderPath, { recursive: true });
      }

      // Create thumbnails directory if it doesn't exist
      const thumbnailsPath = path.join(this.uploadDir, folder, 'thumbnails');
      if (!existsSync(thumbnailsPath)) {
        await mkdir(thumbnailsPath, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.name);
      const filename = `${timestamp}_${randomString}${extension}`;
      const filePath = path.join(folderPath, filename);

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.type.startsWith('image/')) {
        // Optimize images
        const optimizedBuffer = await this.optimizeImage(buffer, file.type);
        await writeFile(filePath, optimizedBuffer);

        // Generate thumbnail
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(thumbnailsPath, thumbnailFilename);
        const thumbnailBuffer = await this.createThumbnail(buffer);
        await writeFile(thumbnailPath, thumbnailBuffer);

        return {
          url: `/uploads/${folder}/${filename}`,
          thumbnailUrl: `/uploads/${folder}/thumbnails/${thumbnailFilename}`,
          filename,
          success: true
        };
      } else {
        // For videos, just save as is (consider video compression later)
        await writeFile(filePath, buffer);
        return {
          url: `/uploads/${folder}/${filename}`,
          filename,
          success: true
        };
      }

    } catch (error) {
      console.error('File upload error:', error);
      return {
        url: '',
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Optimize image for web
   */
  private async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      
      // Get image metadata
      const metadata = await image.metadata();
      
      // Resize if too large (max 1920px width/height)
      if (metadata.width && metadata.width > 1920) {
        image.resize(1920, null, { withoutEnlargement: true });
      }
      
      // Compress based on file type
      switch (mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
          return await image.jpeg({ quality: 80, progressive: true }).toBuffer();
        case 'image/png':
          return await image.png({ compressionLevel: 9 }).toBuffer();
        case 'image/webp':
          return await image.webp({ quality: 80 }).toBuffer();
        default:
          return buffer;
      }
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return buffer;
    }
  }

  /**
   * Create thumbnail for image
   */
  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (error) {
      console.warn('Thumbnail creation failed:', error);
      return buffer;
    }
  }

  /**
   * Validate file before upload
   */
  private async validateFile(file: File): Promise<{ success: boolean; error?: string }> {
    const maxSize = 50 * 1024 * 1024; // 50MB for videos, images will be compressed
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/mov',
      'video/quicktime', // MOV files can have this MIME type
      'video/x-msvideo', // AVI files
      'video/x-ms-wmv', // WMV files
      'video/avi'
    ];

    // Check file size
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 50MB`
      };
    }

    // Check file type
    const isValidType = allowedTypes.includes(file.type);
    if (!isValidType) {
      // Check if it's a video file that might have a different MIME type
      if (file.type.startsWith('video/')) {
        return { success: true };
      }
      
      return {
        success: false,
        error: `File type ${file.type} is not supported. Supported types: ${allowedTypes.join(', ')}`
      };
    }

    return { success: true };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filename: string, folder: string = 'general'): Promise<{ success: boolean; error?: string }> {
    try {
      const fs = await import('fs/promises');
      const filePath = path.join(this.uploadDir, folder, filename);
      const thumbnailPath = path.join(this.uploadDir, folder, 'thumbnails', `thumb_${filename}`);
      
      const deletePromises = [];
      
      // Delete main file
      if (existsSync(filePath)) {
        deletePromises.push(fs.unlink(filePath));
      }
      
      // Delete thumbnail if exists
      if (existsSync(thumbnailPath)) {
        deletePromises.push(fs.unlink(thumbnailPath));
      }
      
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }
}

// Export a singleton instance
export const fileUploadService = new FileUploadService();
