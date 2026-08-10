import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { ReviewRecord, ReviewReadModel } from "./review.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

interface IdRow {
  id: UUID;
}

interface AppointmentInfoRow {
  id: UUID;
  patientId: UUID;
  status: string;
  paymentStatus: string | null;
}

interface ReviewWithDoctorRow {
  id: UUID;
  appointmentId: UUID;
  rating: number;
  comment: string | null;
}

export class ReviewRepository extends BaseRepository {
  private readonly selectFields = `
    id,
    appointment_id AS "appointmentId",
    rating,
    comment
  `;

  private readonly readSelectFields = `
    r.id,
    r.appointment_id AS "appointmentId",
    r.rating,
    r.comment,
    json_build_object('id', pa.id, 'fullName', pa.full_name, 'avatarUrl', pu.avatar_url) AS patient,
    json_build_object('id', s.id, 'date', s.slot_date, 'startTime', s.start_time, 'endTime', s.end_time) AS slot,
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
    appointmentId: UUID;
    rating: number;
    comment: string | null;
  }): Promise<ReviewRecord> {
    const result = await this.query<ReviewRecord>(
      `INSERT INTO reviews (appointment_id, rating, comment)
       VALUES ($1, $2, $3)
       RETURNING ${this.selectFields}`,
      [data.appointmentId, data.rating, data.comment],
    );
    return result.rows[0];
  }

  async findAll(): Promise<ReviewReadModel[]> {
    const result = await this.query<ReviewReadModel>(
      `SELECT ${this.readSelectFields}
       FROM reviews r
       JOIN appointments a        ON r.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       ORDER BY r.id`,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<ReviewReadModel | null> {
    const result = await this.query<ReviewReadModel>(
      `SELECT ${this.readSelectFields}
       FROM reviews r
       JOIN appointments a        ON r.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE r.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByAppointmentId(appointmentId: UUID): Promise<ReviewReadModel | null> {
    const result = await this.query<ReviewReadModel>(
      `SELECT ${this.readSelectFields}
       FROM reviews r
       JOIN appointments a        ON r.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE r.appointment_id = $1`,
      [appointmentId],
    );
    return result.rows[0] ?? null;
  }

  async findAppointmentById(id: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM appointments WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findAppointmentInfo(id: UUID): Promise<AppointmentInfoRow | null> {
    const result = await this.query<AppointmentInfoRow>(
      `SELECT a.id, a.patient_id AS "patientId", a.status,
              (SELECT pay.status FROM payments pay WHERE pay.appointment_id = a.id LIMIT 1) AS "paymentStatus"
       FROM appointments a WHERE a.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findPatientByUserId(userId: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM patients WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findDoctorByUserId(userId: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM doctors WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findReviewsByPatientId(patientId: UUID): Promise<ReviewReadModel[]> {
    const result = await this.query<ReviewReadModel>(
      `SELECT ${this.readSelectFields}
       FROM reviews r
       JOIN appointments a        ON r.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE a.patient_id = $1
       ORDER BY r.id`,
      [patientId],
    );
    return result.rows;
  }

  async findReviewsByDoctorId(doctorId: UUID): Promise<ReviewReadModel[]> {
    const result = await this.query<ReviewReadModel>(
      `SELECT ${this.readSelectFields}
       FROM reviews r
       JOIN appointments a        ON r.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE s.doctor_id = $1 AND s.deleted_at IS NULL
       ORDER BY r.id`,
      [doctorId],
    );
    return result.rows;
  }

  async existsForAppointment(appointmentId: UUID): Promise<boolean> {
    const result = await this.query<IdRow>(
      `SELECT id FROM reviews WHERE appointment_id = $1`,
      [appointmentId],
    );
    return result.rows.length > 0;
  }

  async update(
    id: UUID,
    data: {
      rating?: number;
      comment?: string | null;
    },
  ): Promise<ReviewRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.rating !== undefined) {
      sets.push(`rating = $${paramIndex++}`);
      values.push(data.rating);
    }
    if (data.comment !== undefined) {
      sets.push(`comment = $${paramIndex++}`);
      values.push(data.comment);
    }

    if (sets.length === 0) return null;

    values.push(id);
    const result = await this.query<ReviewRecord>(
      `UPDATE reviews
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM reviews WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const reviewRepository = new ReviewRepository(pool);
