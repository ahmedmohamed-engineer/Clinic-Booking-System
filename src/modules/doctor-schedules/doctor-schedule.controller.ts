import type { Request, Response, NextFunction } from "express";
import { BaseController } from "../../shared/controllers/base.controller.js";
import { doctorScheduleService } from "./doctor-schedule.service.js";

export class DoctorScheduleController extends BaseController {
  findMySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = await doctorScheduleService.findMySchedule(req.user!.sub);
      this.ok(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await doctorScheduleService.create(req.body);
      this.created(res, schedule, "Schedule created successfully");
    } catch (error) {
      next(error);
    }
  };

  createMySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await doctorScheduleService.createMySchedule(req.user!.sub, req.body);
      this.created(res, schedule, "Schedule created successfully");
    } catch (error) {
      next(error);
    }
  };

  updateMySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await doctorScheduleService.updateMySchedule(
        req.user!.sub,
        req.params.id as string,
        req.body,
      );
      this.ok(res, schedule, "Schedule updated successfully");
    } catch (error) {
      next(error);
    }
  };

  deleteMySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await doctorScheduleService.deleteMySchedule(req.user!.sub, req.params.id as string);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = await doctorScheduleService.findAll();
      this.ok(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await doctorScheduleService.findById(req.params.id as string);
      this.ok(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  findByDoctorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = await doctorScheduleService.findByDoctorId(req.params.doctorId as string);
      this.ok(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await doctorScheduleService.update(req.params.id as string, req.body);
      this.ok(res, schedule, "Schedule updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await doctorScheduleService.delete(req.params.id as string);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  };
}

export const doctorScheduleController = new DoctorScheduleController();
