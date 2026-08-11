import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const baseCreateSchema = z.object({
  doctorId: z.string().uuid(),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)"),
  slotDuration: z.number().int().min(1),
});

export const createDoctorScheduleSchema = baseCreateSchema.refine(
  (data) => data.endTime > data.startTime,
  { message: "End time must be after start time", path: ["endTime"] },
);

export const createMyDoctorScheduleSchema = baseCreateSchema
  .omit({ doctorId: true })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateDoctorScheduleSchema = z.object({
  doctorId: z.string().uuid().optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(timeRegex, "Invalid time format (HH:mm)").optional(),
  slotDuration: z.number().int().min(1).optional(),
}).refine(
  (data) => {
    if (!data.startTime || !data.endTime) return true;
    return data.endTime > data.startTime;
  },
  { message: "End time must be after start time", path: ["endTime"] },
);

export type CreateDoctorScheduleInput = z.infer<typeof createDoctorScheduleSchema>;
export type CreateMyDoctorScheduleInput = z.infer<typeof createMyDoctorScheduleSchema>;
export type UpdateDoctorScheduleInput = z.infer<typeof updateDoctorScheduleSchema>;
