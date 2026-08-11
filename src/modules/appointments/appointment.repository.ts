import { BaseRepository } from "../../shared/repositories/base.repository.js";
import { pool } from "../../services/database.service.js";
import { ACTIVE_APPOINTMENT_STATUSES } from "./appointment.constants.js";
import type { AppointmentRecord, AppointmentReadModel } from "./appointment.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

interface IdRow {
  id: UUID;
}

interface SlotStatusRow {
  id: UUID;
  status: string;
  deletedAt: Date | null;
}

interface SlotTimeInfo {
  id: UUID;
  doctorId: UUID;
  slotDate: string;
  startTime: string;
}

export class AppointmentRepository extends BaseRepository {
  private readonly selectFields = `
    id,
    patient_id AS "patientId",
    slot_id AS "slotId",
    status,
    notes
  `;

  private readonly readSelectFields = `
    a.id,
    a.patient_id AS "patientId",
    a.slot_id AS "slotId",
    a.status,
    a.notes,
    json_build_object('id', p.id, 'fullName', p.full_name, 'avatarUrl', pu.avatar_url) AS patient,
    json_build_object('id', s.id, 'date', s.slot_date, 'startTime', s.start_time, 'endTime', s.end_time) AS slot,
    json_build_object(
      'id', d.id,
      'displayName', COALESCE(NULLIF(TRIM(u.full_name), ''), 'Doctor'),
      'clinicName', cl.name,
      'specialtyName', sp.name,
      'consultationFee', d.consultation_fee::float8,
      'avatarUrl', u.avatar_url
    ) AS doctor,
    (SELECT pay.status FROM payments pay WHERE pay.appointment_id = a.id LIMIT 1) AS "paymentStatus",
    EXISTS(SELECT 1 FROM reviews r WHERE r.appointment_id = a.id) AS "reviewExists"
  `;

  async create(data: {
    patientId: UUID;
    slotId: UUID;
    status: string;
    notes: string | null;
  }): Promise<AppointmentRecord> {
    const result = await this.query<AppointmentRecord>(
      `INSERT INTO appointments (patient_id, slot_id, status, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING ${this.selectFields}`,
      [data.patientId, data.slotId, data.status, data.notes],
    );
    return result.rows[0];
  }

  async findAll(): Promise<AppointmentReadModel[]> {
    const result = await this.query<AppointmentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM appointments a
       JOIN patients p          ON a.patient_id = p.id
       JOIN appointment_slots s ON a.slot_id     = s.id
       JOIN doctors d           ON s.doctor_id   = d.id
       JOIN users u             ON d.user_id     = u.id
       JOIN users pu            ON p.user_id     = pu.id
       JOIN clinics cl          ON d.clinic_id   = cl.id
       JOIN specialties sp      ON d.specialty_id = sp.id
       ORDER BY a.id`,
    );
    return result.rows;
  }

  async findById(id: UUID): Promise<AppointmentReadModel | null> {
    const result = await this.query<AppointmentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM appointments a
       JOIN patients p          ON a.patient_id = p.id
       JOIN appointment_slots s ON a.slot_id     = s.id
       JOIN doctors d           ON s.doctor_id   = d.id
       JOIN users u             ON d.user_id     = u.id
       JOIN users pu            ON p.user_id     = pu.id
       JOIN clinics cl          ON d.clinic_id   = cl.id
       JOIN specialties sp      ON d.specialty_id = sp.id
       WHERE a.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByPatientId(patientId: UUID): Promise<AppointmentReadModel[]> {
    const result = await this.query<AppointmentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM appointments a
       JOIN patients p          ON a.patient_id = p.id
       JOIN appointment_slots s ON a.slot_id     = s.id
       JOIN doctors d           ON s.doctor_id   = d.id
       JOIN users u             ON d.user_id     = u.id
       JOIN users pu            ON p.user_id     = pu.id
       JOIN clinics cl          ON d.clinic_id   = cl.id
       JOIN specialties sp      ON d.specialty_id = sp.id
       WHERE a.patient_id = $1
       ORDER BY a.id`,
      [patientId],
    );
    return result.rows;
  }

  async findByDoctorId(doctorId: UUID): Promise<AppointmentReadModel[]> {
    const result = await this.query<AppointmentReadModel>(
      `SELECT ${this.readSelectFields}
       FROM appointments a
       JOIN patients p          ON a.patient_id = p.id
       JOIN appointment_slots s ON a.slot_id     = s.id
       JOIN doctors d           ON s.doctor_id   = d.id
       JOIN users u             ON d.user_id     = u.id
       JOIN users pu            ON p.user_id     = pu.id
       JOIN clinics cl          ON d.clinic_id   = cl.id
       JOIN specialties sp      ON d.specialty_id = sp.id
       WHERE s.doctor_id = $1 AND s.deleted_at IS NULL
       ORDER BY a.id`,
      [doctorId],
    );
    return result.rows;
  }

  async existsForSlot(slotId: UUID): Promise<boolean> {
    const result = await this.query<IdRow>(
      `SELECT id FROM appointments
       WHERE slot_id = $1 AND status = ANY($2::appointment_status[])`,
      [slotId, [...ACTIVE_APPOINTMENT_STATUSES]],
    );
    return result.rows.length > 0;
  }

  async existsActiveForSlotExcluding(slotId: UUID, excludeId: UUID): Promise<boolean> {
    const result = await this.query<IdRow>(
      `SELECT id FROM appointments
       WHERE slot_id = $1 AND status = ANY($2::appointment_status[]) AND id != $3`,
      [slotId, [...ACTIVE_APPOINTMENT_STATUSES], excludeId],
    );
    return result.rows.length > 0;
  }

  async findSlotById(id: UUID): Promise<SlotStatusRow | null> {
    const result = await this.query<SlotStatusRow>(
      `SELECT id, status, deleted_at AS "deletedAt"
       FROM appointment_slots
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findPatientById(id: UUID): Promise<IdRow | null> {
    const result = await this.query<IdRow>(
      `SELECT id FROM patients WHERE id = $1`,
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

  async findSlotTimeInfo(slotId: UUID): Promise<SlotTimeInfo | null> {
    const result = await this.query<SlotTimeInfo>(
      `SELECT id, doctor_id AS "doctorId", slot_date AS "slotDate", start_time AS "startTime"
       FROM appointment_slots
       WHERE id = $1 AND deleted_at IS NULL`,
      [slotId],
    );
    return result.rows[0] ?? null;
  }

  async updateSlotStatus(slotId: UUID, status: string): Promise<void> {
    await this.query(
      `UPDATE appointment_slots SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`,
      [status, slotId],
    );
  }

  async update(
    id: UUID,
    data: {
      status?: string;
      notes?: string | null;
    },
  ): Promise<AppointmentRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      sets.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      sets.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (sets.length === 0) return null;

    values.push(id);
    const result = await this.query<AppointmentRecord>(
      `UPDATE appointments
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING ${this.selectFields}`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async cancelIfSchedulable(id: UUID, slotId: UUID): Promise<AppointmentRecord | null> {
    return this.transaction(async () => {
      const result = await this.query<AppointmentRecord>(
        `UPDATE appointments
         SET status = 'cancelled'
         WHERE id = $1 AND status = ANY($2::appointment_status[])
         RETURNING ${this.selectFields}`,
        [id, [...ACTIVE_APPOINTMENT_STATUSES]],
      );
      const appointment = result.rows[0] ?? null;
      if (appointment) {
        await this.updateSlotStatus(slotId, "available");
      }
      return appointment;
    });
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM appointments WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

}

export const appointmentRepository = new AppointmentRepository(pool);
