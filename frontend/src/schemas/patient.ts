import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createPatientSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1).max(255),
  phone: z.string().max(50).nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  birthDate: z.string().regex(dateRegex).nullable().optional(),
});

export const updatePatientSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Full name must be 255 characters or fewer")
    .optional(),
  phone: z.string().max(50, "Phone must be 50 characters or fewer").nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  birthDate: z.string().regex(dateRegex, "Birth date must be a valid date").nullable().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
