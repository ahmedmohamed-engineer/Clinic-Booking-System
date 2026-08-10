import type { UUID } from "../../shared/types/common.types.js";

export interface PatientRecord {
  id: UUID;
  userId: UUID;
  fullName: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
}
