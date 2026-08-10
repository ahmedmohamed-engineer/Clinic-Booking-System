import type { UUID } from "../../shared/types/common.types.js";
import type { UserRole } from "../../shared/types/user.types.js";

export interface UserRecord {
  id: UUID;
  email: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UpdateUserInput {
  email?: string;
  role?: UserRole;
  isVerified?: boolean;
  avatarUrl?: string | null;
}
