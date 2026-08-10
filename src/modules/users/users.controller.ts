import type { Request, Response, NextFunction } from "express";
import { BaseController } from "../../shared/controllers/base.controller.js";
import { AppError } from "../../shared/errors/app-error.js";
import { userFilterSchema } from "./users.validation.js";
import { usersService } from "./users.service.js";

export class UsersController extends BaseController {
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = userFilterSchema.safeParse(req.query);
      if (!parsed.success) {
        throw AppError.badRequest("Validation failed", parsed.error.issues);
      }
      const { data, pagination } = await usersService.findAll(parsed.data);
      this.paginated(res, data, pagination);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.findById(req.params.id as string);
      this.ok(res, user);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.update(req.params.id as string, req.body);
      this.ok(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await usersService.softDelete(req.params.id as string);
      this.noContent(res);
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }
      const user = await usersService.uploadAvatar(req.user.sub, req.file);
      this.ok(res, user, "Avatar updated successfully");
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
