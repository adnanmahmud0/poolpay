import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { PaymentControllers } from "./payment.controller";

const router = Router();

router.get(
  "/my-payments",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentControllers.getMyPayments
);

export const PaymentRoutes = router;
