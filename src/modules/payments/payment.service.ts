import { paymentRepository } from "./payment.repository.js";
import { AppError } from "../../shared/errors/app-error.js";
import { HttpStatus } from "../../shared/constants/http-status.js";
import type { CreatePaymentDto, UpdatePaymentDto } from "./payment.types.js";
import type { PaymentRecord, PaymentReadModel } from "./payment.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";

export class PaymentService {
  async createAsPatient(userId: UUID, dto: CreatePaymentDto): Promise<PaymentRecord> {
    const patient = await paymentRepository.findPatientByUserId(userId);
    if (!patient) {
      throw AppError.notFound("Patient profile not found");
    }

    const appointment = await paymentRepository.findAppointmentPatientId(dto.appointmentId);
    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }
    if (appointment.patientId !== patient.id) {
      throw AppError.forbidden("You can only pay for your own appointments");
    }
    if (appointment.status === "cancelled") {
      throw new AppError(HttpStatus.BAD_REQUEST, "Cannot pay for a cancelled appointment");
    }

    return this.create(dto);
  }

  async findMyPayments(userId: UUID): Promise<PaymentReadModel[]> {
    const patient = await paymentRepository.findPatientByUserId(userId);
    if (!patient) return [];

    return paymentRepository.findByPatientId(patient.id);
  }

  async payAsPatient(userId: UUID, id: UUID, dto: UpdatePaymentDto): Promise<PaymentRecord> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw AppError.notFound("Payment not found");
    }

    const patient = await paymentRepository.findPatientByUserId(userId);
    if (!patient) {
      throw AppError.notFound("Patient profile not found");
    }
    if (payment.patient.id !== patient.id) {
      throw AppError.forbidden("You can only pay for your own payments");
    }

    if (payment.status !== "pending") {
      throw new AppError(HttpStatus.CONFLICT, "Only pending payments can be paid");
    }

    const appointment = await paymentRepository.findAppointmentPatientId(payment.appointmentId);
    if (appointment?.status === "cancelled") {
      throw new AppError(HttpStatus.BAD_REQUEST, "Cannot pay for a cancelled appointment");
    }

    if (dto.amount !== undefined) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Patients cannot change the payment amount");
    }
    if (dto.status !== undefined && dto.status !== "paid") {
      throw new AppError(HttpStatus.BAD_REQUEST, "Patients can only mark a payment as paid");
    }

    const updated = await paymentRepository.update(id, {
      status: "paid",
      method: dto.method,
      transactionReference: dto.transactionReference,
    });
    if (!updated) {
      throw AppError.notFound("Payment not found");
    }
    return updated;
  }

  async create(dto: CreatePaymentDto): Promise<PaymentRecord> {
    const appointment = await paymentRepository.findAppointmentById(dto.appointmentId);
    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }

    const existing = await paymentRepository.existsForAppointment(dto.appointmentId);
    if (existing) {
      throw new AppError(HttpStatus.CONFLICT, "A payment already exists for this appointment");
    }

    return paymentRepository.create({
      appointmentId: dto.appointmentId,
      amount: dto.amount,
      method: dto.method,
      status: dto.status ?? "pending",
      transactionReference: dto.transactionReference ?? null,
    });
  }

  async findAll(): Promise<PaymentReadModel[]> {
    return paymentRepository.findAll();
  }

  async findById(id: UUID): Promise<PaymentReadModel> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw AppError.notFound("Payment not found");
    }
    return payment;
  }

  async findByAppointmentId(appointmentId: UUID): Promise<PaymentReadModel> {
    const appointment = await paymentRepository.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }

    const payment = await paymentRepository.findByAppointmentId(appointmentId);
    if (!payment) {
      throw AppError.notFound("Payment not found for this appointment");
    }
    return payment;
  }

  async update(id: UUID, dto: UpdatePaymentDto): Promise<PaymentRecord> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw AppError.notFound("Payment not found");
    }

    if (
      dto.amount === undefined &&
      dto.method === undefined &&
      dto.status === undefined &&
      dto.transactionReference === undefined
    ) {
      throw new AppError(HttpStatus.BAD_REQUEST, "No fields provided for update");
    }

    const updated = await paymentRepository.update(id, {
      amount: dto.amount,
      method: dto.method,
      status: dto.status,
      transactionReference: dto.transactionReference,
    });
    if (!updated) {
      throw AppError.notFound("Payment not found");
    }
    return updated;
  }

  async delete(id: UUID): Promise<void> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw AppError.notFound("Payment not found");
    }

    await paymentRepository.delete(id);
  }
}

export const paymentService = new PaymentService();
