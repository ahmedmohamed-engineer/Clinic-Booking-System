import type { UUID } from "../../shared/types/common.types.js";

export interface ClinicRecord {
  id: UUID;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  description: string | null;
  doctorsCount: number;
}
