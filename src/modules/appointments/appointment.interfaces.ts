import type { UUID } from "../../shared/types/common.types.js";
import type { PatientSummary, DoctorSummary, SlotSummary } from "../../shared/types/read-models.js";

export interface AppointmentRecord {
  id: UUID;
  patientId: UUID;
  slotId: UUID;
  status: string;
  notes: string | null;
}

export interface AppointmentReadModel extends AppointmentRecord {
  patient: PatientSummary;
  slot: SlotSummary;
  doctor: DoctorSummary;
  paymentStatus: string | null;
  reviewExists: boolean;
}
