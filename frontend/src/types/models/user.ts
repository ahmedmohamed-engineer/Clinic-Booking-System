import type { UserRole } from "../enums";

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  fullName?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserUpdateRequest {
  email?: string;
  role?: UserRole;
  isVerified?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  isVerified?: boolean;
  search?: string;
}
