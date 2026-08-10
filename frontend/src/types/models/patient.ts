export interface PatientRecord {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  avatarUrl?: string | null;
}

export interface PatientCreateRequest {
  userId: string;
  fullName: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
}

export interface PatientUpdateRequest {
  fullName?: string;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
}
