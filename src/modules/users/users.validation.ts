import { z } from "zod";

const boolParam = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(["patient", "doctor", "admin"]).optional(),
  isVerified: z.boolean().optional(),
});

export const userFilterSchema = z.object({
  role: z.enum(["patient", "doctor", "admin"]).optional(),
  isVerified: boolParam.optional(),
  search: z.string().optional(),
  deletedOnly: boolParam.optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
