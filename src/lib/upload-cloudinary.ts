import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  filename: string;
  success: boolean;
  error?: string;
  thumbnailUrl?: string;
}

export class CloudinaryUploadService {
  /**
   * Check if Cloudinary is configured
   */
  private isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  /**
   * Upload a file to Cloudinary with optimization
   * @param file - The file to upload
   * @param folder - The folder to store the file in (e.g., 'products', 'users')
   * @returns Promise<UploadResult>
   */
  async uploadFile(file: File, folder: string = 'general'): Promise<UploadResult> {
    try {
      // Check if Cloudinary is configured
      if (!this.isConfigured()) {
        return {
          url: '',
          filename: '',
          success: false,
          error: 'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
        };
      }

      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.success) {
        return { url: '', filename: '', success: false, error: validation.error };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = this.getFileExtension(file.name);
      const filename = `${timestamp}_${randomString}${extension}`;
      const publicId = `${folder}/${filename.replace(extension, '')}`;

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.type.startsWith('image/')) {
        // Optimize images
        const optimizedBuffer = await this.optimizeImage(buffer, file.type);
        
        // Upload optimized image
        const result = await cloudinary.uploader.upload(
          `data:${file.type};base64,${optimizedBuffer.toString('base64')}`,
          {
            public_id: publicId,
            folder: folder,
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
            transformation: [
              { width: 1920, height: 1920, crop: 'limit' }
            ]
          }
        );

        // Create thumbnail
        const thumbnailResult = await cloudinary.uploader.upload(
          `data:${file.type};base64,${optimizedBuffer.toString('base64')}`,
          {
            public_id: `${publicId}_thumb`,
            folder: folder,
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
            transformation: [
              { width: 300, height: 300, crop: 'fill', gravity: 'auto' }
            ]
          }
        );

        return {
          url: result.secure_url,
          thumbnailUrl: thumbnailResult.secure_url,
          filename,
          success: true
        };
      } else {
        // For videos, upload as is
        const result = await cloudinary.uploader.upload(
          `data:${file.type};base64,${buffer.toString('base64')}`,
          {
            public_id: publicId,
            folder: folder,
            resource_type: 'video',
            quality: 'auto',
            fetch_format: 'auto'
          }
        );

        return {
          url: result.secure_url,
          filename,
          success: true
        };
      }

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        url: '',
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
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
      
      // Convert to WebP for better compression
      return await image.webp({ quality: 80 }).toBuffer();
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
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
   * Delete a file from Cloudinary
   */
  async deleteFile(filename: string, folder: string = 'general'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Cloudinary is not configured'
        };
      }

      const publicId = `${folder}/${filename.replace(/\.[^/.]+$/, '')}`;
      
      // Delete main file
      await cloudinary.uploader.destroy(publicId);
      
      // Delete thumbnail
      await cloudinary.uploader.destroy(`${publicId}_thumb`);
      
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
export const cloudinaryUploadService = new CloudinaryUploadService();
