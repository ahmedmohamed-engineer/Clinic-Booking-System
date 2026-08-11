import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { ClinicRecord } from "./clinic.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

export class ClinicRepository extends BaseRepository {
  private readonly selectFields = `
    id,
    name,
    phone,
    address,
    city,
    description,
    (SELECT COUNT(*)::int FROM doctors d WHERE d.clinic_id = clinics.id) AS "doctorsCount"
  `;

  async create(data: {
    name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    description: string | null;
  }): Promise<ClinicRecord> {
    const result = await this.query<ClinicRecord>(
      `INSERT INTO clinics (name, phone, address, city, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${this.selectFields}`,
      [data.name, data.phone, data.address, data.city, data.description],
    );
    return result.rows[0];
  }

  async findAll(): Promise<ClinicRecord[]> {
    const result = await this.query<ClinicRecord>(
      `SELECT ${this.selectFields}
       FROM clinics
       ORDER BY name ASC`,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<ClinicRecord | null> {
    const result = await this.query<ClinicRecord>(
      `SELECT ${this.selectFields}
       FROM clinics
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async update(
    id: UUID,
    data: {
      name?: string;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      description?: string | null;
    },
  ): Promise<ClinicRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      sets.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      sets.push(`address = $${paramIndex++}`);
      values.push(data.address);
    }
    if (data.city !== undefined) {
      sets.push(`city = $${paramIndex++}`);
      values.push(data.city);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (sets.length === 0) return null;

    values.push(id);
    const result = await this.query<ClinicRecord>(
      `UPDATE clinics
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM clinics WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const clinicRepository = new ClinicRepository(pool);
