import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { DoctorScheduleReadModel, DoctorScheduleRecord } from "@/types/models/schedule";
import type {
  CreateMyDoctorScheduleInput,
  UpdateDoctorScheduleInput,
} from "@/schemas/schedule";

export async function getMySchedule(): Promise<DoctorScheduleReadModel[]> {
  const response = await api.get<ApiResponse<DoctorScheduleReadModel[]>>(
    "/doctor-schedules/me",
  );
  return response.data.data;
}

export async function createMySchedule(
  data: CreateMyDoctorScheduleInput,
): Promise<DoctorScheduleRecord> {
  const response = await api.post<ApiResponse<DoctorScheduleRecord>>(
    "/doctor-schedules/me",
    data,
  );
  return response.data.data;
}

export async function updateMySchedule(
  id: string,
  data: UpdateDoctorScheduleInput,
): Promise<DoctorScheduleRecord> {
  const response = await api.patch<ApiResponse<DoctorScheduleRecord>>(
    `/doctor-schedules/me/${id}`,
    data,
  );
  return response.data.data;
}

export async function deleteMySchedule(id: string): Promise<void> {
  await api.delete(`/doctor-schedules/me/${id}`);
}
