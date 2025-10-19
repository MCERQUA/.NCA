import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Cloudinary folder path (e.g., 'nca-contractors/logos')
 * @param publicId - Optional custom public ID for the image
 */
export async function uploadImage(
  file: Buffer | string,
  folder: string = 'nca-contractors',
  publicId?: string
): Promise<UploadResult> {
  try {
    // Convert Buffer to base64 data URI, or use string directly
    const uploadFile = Buffer.isBuffer(file)
      ? `data:image/jpeg;base64,${file.toString('base64')}`
      : file;

    const result = await cloudinary.uploader.upload(
      uploadFile,
      {
        folder,
        public_id: publicId,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ],
        overwrite: false,
        resource_type: 'image',
      }
    );

    return {
      url: result.url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload contractor logo (optimized for logos)
 */
export async function uploadContractorLogo(file: Buffer | string, contractorSlug: string): Promise<UploadResult> {
  return uploadImage(
    file,
    'nca-contractors/logos',
    `logo-${contractorSlug}-${Date.now()}`
  );
}

/**
 * Upload contractor profile/cover image
 */
export async function uploadContractorImage(file: Buffer | string, contractorSlug: string): Promise<UploadResult> {
  return uploadImage(
    file,
    'nca-contractors/images',
    `image-${contractorSlug}-${Date.now()}`
  );
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

export { cloudinary };
