import dotenv from "dotenv";
import { z } from "zod";
import type { StringValue } from "ms";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  CORS_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).pipe(z.custom<StringValue>()),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).pipe(z.custom<StringValue>()),
  SYSTEM_ADMIN_EMAIL: z.string().email().optional(),
  SYSTEM_ADMIN_PASSWORD: z.string().min(8).optional(),
  SYSTEM_ADMIN_NAME: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
