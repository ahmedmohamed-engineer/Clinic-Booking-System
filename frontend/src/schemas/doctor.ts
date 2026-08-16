import { z } from "zod";

export const createDoctorSchema = z.object({
  userId: z.string().uuid(),
  clinicId: z.string().uuid(),
  specialtyId: z.string().uuid(),
  consultationFee: z.number().min(0),
  bio: z.string().nullable().optional(),
  experienceYears: z.number().int().min(0).optional(),
});

export const updateDoctorSchema = z.object({
  clinicId: z.string().uuid().optional(),
  specialtyId: z.string().uuid().optional(),
  consultationFee: z.number().min(0).optional(),
  bio: z.string().nullable().optional(),
  experienceYears: z.number().int().min(0).optional(),
});

export const updateMyDoctorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(255, "Full name must be 255 characters or fewer")
    .optional(),
  consultationFee: z
    .number()
    .finite("Consultation fee must be a valid number")
    .min(0, "Consultation fee cannot be negative")
    .optional(),
  bio: z.string().trim().nullable().optional(),
  experienceYears: z
    .number()
    .int("Experience must be a whole number")
    .finite("Experience must be a valid number")
    .min(0, "Experience cannot be negative")
    .optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type UpdateMyDoctorInput = z.infer<typeof updateMyDoctorSchema>;
