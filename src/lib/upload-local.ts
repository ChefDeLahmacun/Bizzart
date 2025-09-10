import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export interface UploadResult {
  url: string;
  filename: string;
  success: boolean;
  error?: string;
  thumbnailUrl?: string;
}

export class LocalUploadService {
  /**
   * Upload a file to local storage
   */
  async uploadFile(file: File, folder: string = 'uploads'): Promise<UploadResult> {
    try {
      // Create directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', folder);
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}_${randomString}.${extension}`;
      
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process image with sharp (resize, optimize)
      let processedBuffer = buffer;
      if (file.type.startsWith('image/')) {
        processedBuffer = await sharp(buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      // Save file
      const filePath = join(uploadDir, filename);
      await writeFile(filePath, processedBuffer);

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = join(uploadDir, thumbnailFilename);
        
        const thumbnailBuffer = await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        await writeFile(thumbnailPath, thumbnailBuffer);
        thumbnailUrl = `/${folder}/${thumbnailFilename}`;
      }

      return {
        url: `/${folder}/${filename}`,
        filename,
        success: true,
        thumbnailUrl,
      };
    } catch (error) {
      console.error('Local upload error:', error);
      return {
        url: '',
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[], folder: string = 'uploads'): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file, folder))
    );
    return results;
  }
}

// Export singleton instance
export const localUploadService = new LocalUploadService();

