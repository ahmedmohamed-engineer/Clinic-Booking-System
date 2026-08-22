import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { uploadConfig } from "../config/upload.js";
import { AppError } from "../shared/errors/app-error.js";

const AVATARS_SUBDIR = "avatars";
const AVATAR_SIZE = 400;
const AVATAR_EXTENSION = "webp";

function resolveAvatarsDir(): string {
  return path.resolve(uploadConfig.dir, AVATARS_SUBDIR);
}

export function ensureUploadsDirectory(): void {
  fs.mkdirSync(resolveAvatarsDir(), { recursive: true });
}

function isPathInsideUploads(target: string): boolean {
  const uploadsRoot = path.resolve(uploadConfig.dir);
  const absolute = path.resolve(target);
  return absolute.startsWith(uploadsRoot + path.sep);
}

export interface SavedAvatar {
  path: string;
  publicUrl: string;
}

export async function saveAvatar(buffer: Buffer): Promise<SavedAvatar> {
  const dir = resolveAvatarsDir();
  ensureUploadsDirectory();

  const name = `${crypto.randomUUID()}.${AVATAR_EXTENSION}`;
  const filePath = path.join(dir, name);
  const publicUrl = `/uploads/${AVATARS_SUBDIR}/${name}`;

  // Decode + re-encode fully in memory first: a corrupted or spoofed payload
  // (valid MIME, undecodable bytes) fails here and nothing reaches the disk.
  // If this throws, uploadConfig's MIME allow-list already passed, so the
  // failure means the bytes are not a real JPEG/PNG/WebP image.
  let encoded: Buffer;
  try {
    encoded = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .webp()
      .toBuffer();
  } catch {
    throw AppError.badRequest(
      "Invalid image file. Upload a valid JPEG, PNG, or WebP image.",
    );
  }

  // Persist only the freshly re-encoded image. A filesystem error here is a
  // genuine server failure and must surface as a 500, not a client error.
  await fs.promises.writeFile(filePath, encoded);

  return { path: filePath, publicUrl };
}

export async function deleteAvatarByPublicUrl(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;

  try {
    const relative = publicUrl.replace(/^\/uploads\//, "");
    const target = path.resolve(uploadConfig.dir, relative);
    if (!isPathInsideUploads(target)) return;
    await fs.promises.unlink(target);
  } catch {
    // Best-effort cleanup: ignore missing files.
  }
}

export function publicUrlToStoredPath(publicUrl: string): string {
  const relative = publicUrl.replace(/^\/uploads\//, "");
  return path.resolve(uploadConfig.dir, relative);
}