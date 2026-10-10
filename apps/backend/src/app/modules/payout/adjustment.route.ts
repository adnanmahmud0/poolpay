import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { AdjustmentControllers } from "./adjustment.controller";

const router = express.Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdjustmentControllers.getAllAdjustments
);

router.post(
  "/:id/retry",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdjustmentControllers.retryAdjustment
);

export const AdjustmentRoutes = router;
