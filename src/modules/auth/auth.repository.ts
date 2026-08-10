import crypto from "node:crypto";
import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { UserRecord, CreateUserInput } from "./auth.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

interface RefreshTokenRow {
  id: UUID;
  user_id: UUID;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export class AuthRepository extends BaseRepository {
  private readonly selectFields = `
id,
email,
full_name AS "fullName",
avatar_url AS "avatarUrl",
password_hash AS "passwordHash",
role,
is_verified AS "isVerified",
created_at AS "createdAt",
updated_at AS "updatedAt",
deleted_at AS "deletedAt"
`;

  async create(data: CreateUserInput): Promise<UserRecord> {
    const result = await this.query<UserRecord>(
      `INSERT INTO users (email, password_hash, role, is_verified, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${this.selectFields}`,
      [data.email, data.passwordHash, data.role, data.isVerified ?? false, data.fullName ?? null],
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.query<UserRecord>(
      `SELECT ${this.selectFields}
       FROM users
       WHERE email = $1
       AND deleted_at IS NULL`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async findById(id: UUID): Promise<UserRecord | null> {
    const result = await this.query<UserRecord>(
      `SELECT ${this.selectFields}
       FROM users
       WHERE id = $1
       AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async createPatient(userId: UUID, fullName: string): Promise<void> {
    await this.query(
      `INSERT INTO patients (user_id, full_name)
       VALUES ($1, $2)`,
      [userId, fullName],
    );
  }

  async saveRefreshToken(userId: UUID, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const result = await this.query<RefreshTokenRow>(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
       FROM refresh_tokens
       WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}

export const authRepository = new AuthRepository(pool);
