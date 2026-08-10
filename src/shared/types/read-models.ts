import type { UUID } from "./common.types.js";

export interface PatientSummary {
  id: UUID;
  fullName: string;
  avatarUrl: string | null;
}

export interface DoctorSummary {
  id: UUID;
  displayName: string;
  clinicName: string;
  specialtyName: string;
  consultationFee?: number;
  avatarUrl: string | null;
}

export interface SlotSummary {
  id: UUID;
  date: string;
  startTime: string;
  endTime: string;
}
