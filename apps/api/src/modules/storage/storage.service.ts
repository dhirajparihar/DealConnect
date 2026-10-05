import crypto from 'crypto';
import { ApiError } from '../../common/api-error.js';

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  fileUrl: string;
}

export class StorageService {
  private allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
  private maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  validateFile(mimeType: string, sizeBytes: number) {
    if (!this.allowedMimeTypes.has(mimeType.toLowerCase())) {
      throw new ApiError(400, 'INVALID_MEDIA_TYPE', 'Only JPEG, PNG, WEBP, and HEIC images are allowed.');
    }
    if (sizeBytes > this.maxSizeBytes) {
      throw new ApiError(400, 'FILE_TOO_LARGE', 'Image file size must not exceed 10 MB.');
    }
  }

  generateStorageKey(dealerId: string, vehicleId: string, filename: string): string {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase() || '.jpg';
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `dealers/${dealerId}/vehicles/${vehicleId}/${Date.now()}_${randomHash}${ext}`;
  }

  getPublicUrl(storageKey: string): string {
    const endpoint = process.env.STORAGE_ENDPOINT || 'http://localhost:9000';
    const bucket = process.env.STORAGE_BUCKET || 'dealconnect-media';
    return `${endpoint}/${bucket}/${storageKey}`;
  }

  async getPresignedUploadUrl(dealerId: string, vehicleId: string, filename: string, mimeType: string, sizeBytes: number): Promise<PresignedUploadResult> {
    this.validateFile(mimeType, sizeBytes);
    const storageKey = this.generateStorageKey(dealerId, vehicleId, filename);
    const fileUrl = this.getPublicUrl(storageKey);

    // Simulated S3 presigned upload URL for S3/MinIO endpoint
    const uploadUrl = `${fileUrl}?uploadToken=${crypto.randomBytes(16).toString('hex')}`;

    return {
      uploadUrl,
      storageKey,
      fileUrl,
    };
  }
}
