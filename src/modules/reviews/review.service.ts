import { reviewRepository } from "./review.repository.js";
import { AppError } from "../../shared/errors/app-error.js";
import { HttpStatus } from "../../shared/constants/http-status.js";
import type { CreateReviewDto, UpdateReviewDto } from "./review.types.js";
import type { ReviewRecord, ReviewReadModel } from "./review.interfaces.js";
import type { UUID } from "../../shared/types/common.types.js";
import type { UserRole } from "../../shared/types/user.types.js";

export class ReviewService {
  async createAsPatient(userId: UUID, dto: CreateReviewDto): Promise<ReviewRecord> {
    const patient = await reviewRepository.findPatientByUserId(userId);
    if (!patient) {
      throw AppError.notFound("Patient profile not found");
    }

    const appointment = await reviewRepository.findAppointmentInfo(dto.appointmentId);
    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }
    if (appointment.patientId !== patient.id) {
      throw AppError.forbidden("You can only review your own appointments");
    }
    if (appointment.status !== "completed") {
      throw new AppError(HttpStatus.BAD_REQUEST, "Can only review completed appointments");
    }
    if (appointment.paymentStatus !== "paid") {
      throw new AppError(HttpStatus.BAD_REQUEST, "Must pay for the appointment before reviewing");
    }

    return this.create(dto);
  }

  async findMyReviews(userId: UUID, role: UserRole): Promise<ReviewReadModel[]> {
    if (role === "patient") {
      const patient = await reviewRepository.findPatientByUserId(userId);
      if (!patient) return [];
      return reviewRepository.findReviewsByPatientId(patient.id);
    }
    if (role === "doctor") {
      const doctor = await reviewRepository.findDoctorByUserId(userId);
      if (!doctor) return [];
      return reviewRepository.findReviewsByDoctorId(doctor.id);
    }
    return [];
  }

  async create(dto: CreateReviewDto): Promise<ReviewRecord> {
    const appointment = await reviewRepository.findAppointmentById(dto.appointmentId);
    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }

    const existing = await reviewRepository.existsForAppointment(dto.appointmentId);
    if (existing) {
      throw new AppError(HttpStatus.CONFLICT, "A review already exists for this appointment");
    }

    return reviewRepository.create({
      appointmentId: dto.appointmentId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
  }

  async findAll(): Promise<ReviewReadModel[]> {
    return reviewRepository.findAll();
  }

  async findById(id: UUID): Promise<ReviewReadModel> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw AppError.notFound("Review not found");
    }
    return review;
  }

  async findByAppointmentId(appointmentId: UUID): Promise<ReviewReadModel> {
    const appointment = await reviewRepository.findAppointmentById(appointmentId);
    if (!appointment) {
      throw AppError.notFound("Appointment not found");
    }

    const review = await reviewRepository.findByAppointmentId(appointmentId);
    if (!review) {
      throw AppError.notFound("Review not found for this appointment");
    }
    return review;
  }

  async update(id: UUID, dto: UpdateReviewDto): Promise<ReviewRecord> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw AppError.notFound("Review not found");
    }

    if (
      dto.rating === undefined &&
      dto.comment === undefined
    ) {
      throw new AppError(HttpStatus.BAD_REQUEST, "No fields provided for update");
    }

    const updated = await reviewRepository.update(id, {
      rating: dto.rating,
      comment: dto.comment,
    });
    if (!updated) {
      throw AppError.notFound("Review not found");
    }
    return updated;
  }

  async delete(id: UUID): Promise<void> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw AppError.notFound("Review not found");
    }

    await reviewRepository.delete(id);
  }
}

export const reviewService = new ReviewService();
