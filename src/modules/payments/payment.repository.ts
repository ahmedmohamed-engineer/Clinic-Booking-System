import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import type { PaymentRecord, PaymentReadModel } from "./payment.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

interface IdRow {
  id: UUID;
}

interface AppointmentPatientRow {
  id: UUID;
  patientId: UUID;
  status: string;
}

export class PaymentRepository extends BaseRepository {
  private readonly selectFields = `
    id,
    appointment_id AS "appointmentId",
    amount,
    method,
    status,
    transaction_reference AS "transactionReference"
  `;

  private readonly readSelectFields = `
    p.id,
    p.appointment_id AS "appointmentId",
    p.amount,
    p.method,
    p.status,
    p.transaction_reference AS "transactionReference",
    json_build_object('id', pa.id, 'fullName', pa.full_name, 'avatarUrl', pu.avatar_url) AS patient,
    json_build_object('id', s.id, 'date', s.slot_date, 'startTime', s.start_time, 'endTime', s.end_time) AS slot,
    json_build_object(
      'id', d.id,
      'displayName', COALESCE(NULLIF(TRIM(u.full_name), ''), 'Doctor'),
      'clinicName', cl.name,
      'specialtyName', sp.name,
      'consultationFee', d.consultation_fee::float8,
      'avatarUrl', u.avatar_url
    ) AS doctor
  `;

  async create(data: {
    appointmentId: UUID;
    amount: number;
    method: string;
    status: string;
    transactionReference: string | null;
  }): Promise<PaymentRecord> {
    const result = await this.query<PaymentRecord>(
      `INSERT INTO payments (appointment_id, amount, method, status, transaction_reference)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${this.selectFields}`,
      [data.appointmentId, data.amount, data.method, data.status, data.transactionReference],
    );
    return result.rows[0];
  }

  async findAll(): Promise<PaymentReadModel[]> {
    const result = await this.query<PaymentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM payments p
       JOIN appointments a        ON p.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       ORDER BY p.id`,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<PaymentReadModel | null> {
    const result = await this.query<PaymentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM payments p
       JOIN appointments a        ON p.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE p.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByAppointmentId(appointmentId: UUID): Promise<PaymentReadModel | null> {
    const result = await this.query<PaymentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM payments p
       JOIN appointments a        ON p.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE p.appointment_id = $1`,
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

  async findAppointmentPatientId(id: UUID): Promise<AppointmentPatientRow | null> {
    const result = await this.query<AppointmentPatientRow>(
      `SELECT id, patient_id AS "patientId", status FROM appointments WHERE id = $1`,
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

  async findByPatientId(patientId: UUID): Promise<PaymentReadModel[]> {
    const result = await this.query<PaymentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM payments p
       JOIN appointments a        ON p.appointment_id = a.id
       JOIN patients pa           ON a.patient_id     = pa.id
       JOIN appointment_slots s   ON a.slot_id        = s.id
       JOIN doctors d             ON s.doctor_id      = d.id
       JOIN users u               ON d.user_id        = u.id
       JOIN users pu              ON pa.user_id       = pu.id
       JOIN clinics cl            ON d.clinic_id      = cl.id
       JOIN specialties sp        ON d.specialty_id   = sp.id
       WHERE a.patient_id = $1
       ORDER BY p.id`,
      [patientId],
    );
    return result.rows;
  }

  async existsForAppointment(appointmentId: UUID): Promise<boolean> {
    const result = await this.query<IdRow>(
      `SELECT id FROM payments WHERE appointment_id = $1`,
      [appointmentId],
    );
    return result.rows.length > 0;
  }

  async hasLinkedPayment(appointmentId: UUID): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM payments WHERE appointment_id = $1
       ) AS "exists"`,
      [appointmentId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async update(
    id: UUID,
    data: {
      amount?: number;
      method?: string;
      status?: string;
      transactionReference?: string | null;
    },
  ): Promise<PaymentRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.amount !== undefined) {
      sets.push(`amount = $${paramIndex++}`);
      values.push(data.amount);
    }
    if (data.method !== undefined) {
      sets.push(`method = $${paramIndex++}`);
      values.push(data.method);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.transactionReference !== undefined) {
      sets.push(`transaction_reference = $${paramIndex++}`);
      values.push(data.transactionReference);
    }

    if (sets.length === 0) return null;

    values.push(id);
    const result = await this.query<PaymentRecord>(
      `UPDATE payments
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM payments WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const paymentRepository = new PaymentRepository(pool);
