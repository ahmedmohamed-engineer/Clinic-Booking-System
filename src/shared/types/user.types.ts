import type { UUID } from "./common.types.js";

export type UserRole = "patient" | "doctor" | "admin";

export interface UserRecord {
  id: UUID;
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserPublic {
  id: UUID;
  email: string;
  role: UserRole;
  isVerified: boolean;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AuthenticatedUser {
  sub: UUID;
  role: UserRole;
}
