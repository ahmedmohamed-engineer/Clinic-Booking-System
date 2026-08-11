import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { UserRecord, UpdateUserInput } from "./users.interfaces.js";
import type { UserFilter } from "./users.types.js";
import type { UUID } from "../../shared/types/common.types.js";

export class UsersRepository extends BaseRepository {
  private readonly selectFields = `
    id,
    email,
    full_name AS "fullName",
    role,
    avatar_url AS "avatarUrl",
    is_verified AS "isVerified",
    created_at AS "createdAt",
    updated_at AS "updatedAt",
    deleted_at AS "deletedAt"
  `;

  private buildWhere(filter: UserFilter): { clause: string; params: unknown[] } {
    const conditions: string[] = filter.deletedOnly
      ? ["deleted_at IS NOT NULL"]
      : ["deleted_at IS NULL"];
    const params: unknown[] = [];

    if (filter.role) {
      params.push(filter.role);
      conditions.push(`role = $${params.length}`);
    }
    if (filter.isVerified !== undefined) {
      params.push(filter.isVerified);
      conditions.push(`is_verified = $${params.length}`);
    }
    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(
        `(email ILIKE $${params.length} OR full_name ILIKE $${params.length})`,
      );
    }

    return { clause: conditions.length > 0 ? conditions.join(" AND ") : "TRUE", params };
  }

  async count(filter: UserFilter): Promise<number> {
    const { clause, params } = this.buildWhere(filter);
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM users WHERE ${clause}`,
      params,
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async findPage(filter: UserFilter, limit: number, offset: number): Promise<UserRecord[]> {
    const { clause, params } = this.buildWhere(filter);
    params.push(limit, offset);
    const result = await this.query<UserRecord>(
      `SELECT ${this.selectFields}
       FROM users
       WHERE ${clause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<UserRecord | null> {
    const result = await this.query<UserRecord>(
      `SELECT ${this.selectFields}
       FROM users
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async emailExists(email: string, excludeId?: UUID): Promise<boolean> {
    const result = await this.query<{ id: UUID }>(
      `SELECT id FROM users WHERE email = $1 AND ($2::uuid IS NULL OR id != $2) AND deleted_at IS NULL`,
      [email, excludeId ?? null],
    );
    return result.rows.length > 0;
  }

  async update(id: UUID, data: UpdateUserInput): Promise<UserRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      sets.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.role !== undefined) {
      sets.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }
    if (data.isVerified !== undefined) {
      sets.push(`is_verified = $${paramIndex++}`);
      values.push(data.isVerified);
    }
    if (data.avatarUrl !== undefined) {
      sets.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatarUrl);
    }

    if (sets.length === 0) return null;

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.query<UserRecord>(
      `UPDATE users
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async softDelete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `UPDATE users
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const usersRepository = new UsersRepository(pool);
