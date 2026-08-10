import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { PatientRecord } from "./patient.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

interface IdRow {
  id: UUID;
}

export class PatientRepository extends BaseRepository {
  private readonly selectFields = `
    pa.id,
    pa.user_id AS "userId",
    pa.full_name AS "fullName",
    pa.phone,
    pa.gender,
    pa.birth_date AS "birthDate",
    u.avatar_url AS "avatarUrl"
  `;

  private readonly fromClause = `
    FROM patients pa
    LEFT JOIN users u ON u.id = pa.user_id
  `;

  async create(data: {
    userId: UUID;
    fullName: string;
    phone: string | null;
    gender: string | null;
    birthDate: string | null;
  }): Promise<PatientRecord> {
    const result = await this.query<IdRow>(
      `INSERT INTO patients (user_id, full_name, phone, gender, birth_date)
       VALUES ($1, $2, $3, $4, $5::date)
       RETURNING id`,
      [data.userId, data.fullName, data.phone, data.gender, data.birthDate],
    );
    const created = await this.findById(result.rows[0].id);
    if (!created) {
      throw new Error("Failed to load created patient");
    }
    return created;
  }

  async findAll(): Promise<PatientRecord[]> {
    const result = await this.query<PatientRecord>(
      `SELECT ${this.selectFields}
       ${this.fromClause}
       ORDER BY pa.full_name`,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<PatientRecord | null> {
    const result = await this.query<PatientRecord>(
      `SELECT ${this.selectFields}
       ${this.fromClause}
       WHERE pa.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: UUID): Promise<PatientRecord | null> {
    const result = await this.query<PatientRecord>(
      `SELECT ${this.selectFields}
       ${this.fromClause}
       WHERE pa.user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findUserById(id: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async existsForUser(userId: UUID): Promise<boolean> {
    const result = await this.query<IdRow>(
      `SELECT id FROM patients WHERE user_id = $1`,
      [userId],
    );
    return result.rows.length > 0;
  }

  async update(
    id: UUID,
    data: {
      fullName?: string;
      phone?: string | null;
      gender?: string | null;
      birthDate?: string | null;
    },
  ): Promise<PatientRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) {
      sets.push(`full_name = $${paramIndex++}`);
      values.push(data.fullName);
    }
    if (data.phone !== undefined) {
      sets.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.gender !== undefined) {
      sets.push(`gender = $${paramIndex++}`);
      values.push(data.gender);
    }
    if (data.birthDate !== undefined) {
      sets.push(`birth_date = $${paramIndex++}::date`);
      values.push(data.birthDate);
    }

    if (sets.length === 0) return null;

    values.push(id);
    await this.query(
      `UPDATE patients
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}`,
      values,
    );
    return this.findById(id);
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM patients WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const patientRepository = new PatientRepository(pool);
