import { Router } from "express";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import { authenticate, authorize } from "../../shared/middlewares/auth.middleware.js";
import { Permissions } from "../../shared/constants/permissions.js";
import { handleAvatarUpload } from "../../shared/middlewares/upload.middleware.js";
import { updateUserSchema, userFilterSchema } from "./users.validation.js";
import { usersController } from "./users.controller.js";

const router = Router();

router.use(authenticate, authorize(Permissions.MANAGE_USERS));

router.get("/", validate(userFilterSchema), usersController.findAll);
router.get("/:id", usersController.findById);
router.patch("/:id", validate(updateUserSchema), usersController.update);
router.delete("/:id", usersController.softDelete);

export { router as usersRouter };

const selfRouter = Router();

selfRouter.use(authenticate);
selfRouter.post("/avatar", handleAvatarUpload, usersController.uploadAvatar);

export { selfRouter as userSelfRouter };