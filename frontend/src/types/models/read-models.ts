export interface PatientSummary {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface DoctorSummary {
  id: string;
  displayName: string;
  clinicName: string;
  specialtyName: string;
  consultationFee?: number;
  avatarUrl?: string | null;
}

export interface SlotSummary {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}
