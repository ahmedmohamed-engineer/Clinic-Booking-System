import { Router } from "express";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import { Permissions } from "../../shared/constants/permissions.js";
import { createDoctorScheduleSchema, createMyDoctorScheduleSchema, updateDoctorScheduleSchema } from "./doctor-schedule.validation.js";
import { doctorScheduleController } from "./doctor-schedule.controller.js";

const router = Router();

router.get("/me", authenticate, authorize(Permissions.VIEW_OWN_SCHEDULE), doctorScheduleController.findMySchedule);
router.post("/me", authenticate, authorize(Permissions.MANAGE_OWN_SCHEDULE), validate(createMyDoctorScheduleSchema), doctorScheduleController.createMySchedule);
router.patch("/me/:id", authenticate, authorize(Permissions.MANAGE_OWN_SCHEDULE), validate(updateDoctorScheduleSchema), doctorScheduleController.updateMySchedule);
router.delete("/me/:id", authenticate, authorize(Permissions.MANAGE_OWN_SCHEDULE), doctorScheduleController.deleteMySchedule);

router.get("/doctor/:doctorId", authenticate, authorize(Permissions.MANAGE_SCHEDULES), doctorScheduleController.findByDoctorId);
router.get("/", authenticate, authorize(Permissions.MANAGE_SCHEDULES), doctorScheduleController.findAll);
router.get("/:id", authenticate, authorize(Permissions.MANAGE_SCHEDULES), doctorScheduleController.findById);
router.post("/", authenticate, authorize(Permissions.MANAGE_SCHEDULES), validate(createDoctorScheduleSchema), doctorScheduleController.create);
router.patch("/:id", authenticate, authorize(Permissions.MANAGE_SCHEDULES), validate(updateDoctorScheduleSchema), doctorScheduleController.update);
router.delete("/:id", authenticate, authorize(Permissions.MANAGE_SCHEDULES), doctorScheduleController.delete);

export { router as doctorScheduleRouter };
