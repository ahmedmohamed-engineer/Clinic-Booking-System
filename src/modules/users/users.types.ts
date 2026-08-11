import type { UUID } from "../../shared/types/common.types.js";
import type { UserRole } from "../../shared/types/user.types.js";

export interface UpdateUserDto {
  email?: string;
  role?: UserRole;
  isVerified?: boolean;
}

export interface UserFilter {
  role?: UserRole;
  isVerified?: boolean;
  search?: string;
  deletedOnly?: boolean;
  page?: number;
  limit?: number;
}
