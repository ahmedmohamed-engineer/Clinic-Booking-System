import type { Request, Response, NextFunction } from "express";
import multer, { type FileFilterCallback } from "multer";
import { uploadConfig } from "../../config/upload.js";
import { AppError } from "../errors/app-error.js";
import { HttpStatus } from "../constants/http-status.js";

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    callback(
      new AppError(
        HttpStatus.BAD_REQUEST,
        `Unsupported file type "${file.mimetype}". Allowed types: jpeg, png, webp.`,
      ),
    );
    return;
  }
  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: uploadConfig.maxSizeBytes },
});

export function handleAvatarUpload(req: Request, res: Response, next: NextFunction): void {
  upload.single("avatar")(req, res, (error: unknown) => {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(
          new AppError(
            HttpStatus.PAYLOAD_TOO_LARGE,
            `File is too large. Maximum size is ${uploadConfig.maxSizeBytes / (1024 * 1024)}MB.`,
          ),
        );
        return;
      }
      next(new AppError(HttpStatus.BAD_REQUEST, `Upload failed: ${error.message}`));
      return;
    }
    next(error);
  });
}