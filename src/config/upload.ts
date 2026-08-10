export interface UploadConfig {
  dir: string;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export const uploadConfig: UploadConfig = {
  dir: process.env.UPLOAD_DIR ?? "uploads",
  maxSizeBytes: 2 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
};