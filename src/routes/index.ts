import { Router } from "express";
import { authRouter } from "../modules/auth/index.js";
import { clinicRouter, clinicAdminRouter } from "../modules/clinics/index.js";
import { specialtyRouter, specialtyAdminRouter } from "../modules/specialties/index.js";
import { doctorRouter, doctorAdminRouter } from "../modules/doctors/index.js";
import { doctorScheduleRouter } from "../modules/doctor-schedules/index.js";
import { appointmentSlotRouter, appointmentSlotAdminRouter } from "../modules/appointment-slots/index.js";
import { appointmentRouter } from "../modules/appointments/index.js";
import { paymentRouter } from "../modules/payments/index.js";
import { reviewRouter } from "../modules/reviews/index.js";
import { patientRouter } from "../modules/patients/index.js";
import { usersRouter, userSelfRouter } from "../modules/users/index.js";

const router = Router();

router.use("/auth", authRouter);

router.use("/clinics", clinicRouter);
router.use("/specialties", specialtyRouter);
router.use("/doctors", doctorRouter);
router.use("/appointment-slots", appointmentSlotRouter);

router.use("/appointments", appointmentRouter);
router.use("/payments", paymentRouter);
router.use("/reviews", reviewRouter);
router.use("/patients", patientRouter);
router.use("/users", userSelfRouter);
router.use("/doctor-schedules", doctorScheduleRouter);

router.use("/admin/clinics", clinicAdminRouter);
router.use("/admin/specialties", specialtyAdminRouter);
router.use("/admin/doctors", doctorAdminRouter);
router.use("/admin/doctor-schedules", doctorScheduleRouter);
router.use("/admin/appointment-slots", appointmentSlotAdminRouter);
router.use("/admin/appointments", appointmentRouter);
router.use("/admin/payments", paymentRouter);
router.use("/admin/reviews", reviewRouter);
router.use("/admin/patients", patientRouter);
router.use("/admin/users", usersRouter);

export default router;
