import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { uploadConfig } from "../config/upload.js";

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

  await sharp(buffer)
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
    .webp()
    .toFile(filePath);

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