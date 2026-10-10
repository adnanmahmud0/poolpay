import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { NotificationControllers } from "./notification.controller";

const router = Router();

router.get(
  "/",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationControllers.getMyNotifications
);

router.patch(
  "/mark-all-read",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationControllers.markAllAsRead
);

router.patch(
  "/:id/read",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  NotificationControllers.markAsRead
);

export const NotificationRoutes = router;
