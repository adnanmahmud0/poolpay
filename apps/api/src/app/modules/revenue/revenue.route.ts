import { Router } from "express";
import { RevenueControllers } from "./revenue.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  RevenueControllers.getRevenueStats
);

router.get(
  "/metrics",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  RevenueControllers.getRevenueMetrics
);

export const RevenueRoutes = router;
