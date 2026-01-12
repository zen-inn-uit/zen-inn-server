import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dpbk5trba',
      api_key: process.env.CLOUDINARY_API_KEY || '129785664194468',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'oySQdD3ocaWl2hZ3bJBXK_k6Kig',
    });
  }

  /**
   * Upload base64 image to Cloudinary
   * @param base64Image - Base64 encoded image string (with data:image/... prefix)
   * @param folder - Folder path in Cloudinary (e.g., 'hotels', 'rooms')
   * @returns Public URL of uploaded image
   */
  async uploadBase64Image(base64Image: string, folder: string = 'hotels'): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: `zen-inn/${folder}`,
        resource_type: 'auto',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Max size
          { quality: 'auto:good' }, // Auto quality optimization
          { fetch_format: 'auto' }, // Auto format (WebP for modern browsers)
        ],
      });

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Upload multiple base64 images
   */
  async uploadMultipleBase64Images(
    base64Images: string[],
    folder: string = 'hotels',
  ): Promise<string[]> {
    const uploadPromises = base64Images.map((image) => this.uploadBase64Image(image, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete image from Cloudinary by URL
   */
  async deleteImageByUrl(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from URL
      // Example URL: https://res.cloudinary.com/dpbk5trba/image/upload/v1234567890/zen-inn/hotels/abc123.jpg
      const matches = imageUrl.match(/\/zen-inn\/.*?\/([^/.]+)/);
      if (matches && matches[1]) {
        const publicId = `zen-inn/${matches[0].split('/zen-inn/')[1].split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Don't throw error, just log it
    }
  }
}
