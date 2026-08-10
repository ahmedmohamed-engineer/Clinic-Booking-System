import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { DoctorRecord, DoctorReadModel } from "./doctor.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

interface UserRow {
  id: UUID;
  role: string;
}

interface IdRow {
  id: UUID;
}

export class DoctorRepository extends BaseRepository {
  private readonly selectFields = `
    id,
    user_id AS "userId",
    clinic_id AS "clinicId",
    specialty_id AS "specialtyId",
    consultation_fee AS "consultationFee",
    bio,
    experience_years AS "experienceYears"
  `;

  private readonly readSelectFields = `
    d.id,
    d.user_id AS "userId",
    d.clinic_id AS "clinicId",
    d.specialty_id AS "specialtyId",
    d.consultation_fee AS "consultationFee",
    d.bio,
    d.experience_years AS "experienceYears",
    json_build_object(
      'id', d.id,
      'displayName', COALESCE(u.full_name, u.email),
      'clinicName', cl.name,
      'specialtyName', sp.name,
      'consultationFee', d.consultation_fee::float8,
      'avatarUrl', u.avatar_url
    ) AS doctor
  `;

  async create(data: {
    userId: UUID;
    clinicId: UUID;
    specialtyId: UUID;
    consultationFee: string;
    bio: string | null;
    experienceYears: number;
  }): Promise<DoctorRecord> {
    const result = await this.query<DoctorRecord>(
      `INSERT INTO doctors (user_id, clinic_id, specialty_id, consultation_fee, bio, experience_years)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${this.selectFields}`,
      [data.userId, data.clinicId, data.specialtyId, data.consultationFee, data.bio, data.experienceYears],
    );
    return result.rows[0];
  }

  async findAll(): Promise<DoctorReadModel[]> {
    const result = await this.query<DoctorReadModel>(
      `SELECT ${this.readSelectFields}
       FROM doctors d
       JOIN users u        ON d.user_id      = u.id
       JOIN clinics cl     ON d.clinic_id    = cl.id
       JOIN specialties sp ON d.specialty_id = sp.id
       ORDER BY d.experience_years DESC, d.id ASC`,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<DoctorReadModel | null> {
    const result = await this.query<DoctorReadModel>(
      `SELECT ${this.readSelectFields}
       FROM doctors d
       JOIN users u        ON d.user_id      = u.id
       JOIN clinics cl     ON d.clinic_id    = cl.id
       JOIN specialties sp ON d.specialty_id = sp.id
       WHERE d.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: UUID): Promise<DoctorReadModel | null> {
    const result = await this.query<DoctorReadModel>(
      `SELECT ${this.readSelectFields}
       FROM doctors d
       JOIN users u        ON d.user_id      = u.id
       JOIN clinics cl     ON d.clinic_id    = cl.id
       JOIN specialties sp ON d.specialty_id = sp.id
       WHERE d.user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findUserById(id: UUID): Promise<UserRow | null> {
    const result = await this.query<UserRow>(
      `SELECT id, role
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async updateUserFullName(userId: UUID, fullName: string): Promise<void> {
    await this.query(
      `UPDATE users
       SET full_name = $2, updated_at = NOW()
       WHERE id = $1`,
      [userId, fullName],
    );
  }

  async findClinicById(id: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM clinics WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findSpecialtyById(id: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM specialties WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async update(
    id: UUID,
    data: {
      clinicId?: UUID;
      specialtyId?: UUID;
      consultationFee?: string;
      bio?: string | null;
      experienceYears?: number;
    },
  ): Promise<DoctorRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.clinicId !== undefined) {
      sets.push(`clinic_id = $${paramIndex++}`);
      values.push(data.clinicId);
    }
    if (data.specialtyId !== undefined) {
      sets.push(`specialty_id = $${paramIndex++}`);
      values.push(data.specialtyId);
    }
    if (data.consultationFee !== undefined) {
      sets.push(`consultation_fee = $${paramIndex++}`);
      values.push(data.consultationFee);
    }
    if (data.bio !== undefined) {
      sets.push(`bio = $${paramIndex++}`);
      values.push(data.bio);
    }
    if (data.experienceYears !== undefined) {
      sets.push(`experience_years = $${paramIndex++}`);
      values.push(data.experienceYears);
    }

    if (sets.length === 0) return null;

    values.push(id);
    const result = await this.query<DoctorRecord>(
      `UPDATE doctors
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM doctors WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const doctorRepository = new DoctorRepository(pool);
