import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { PaymentMethodControllers } from "./paymentMethod.controller";
import { PaymentMethodValidation } from "./paymentMethod.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(PaymentMethodValidation.addPaymentMethodSchema),
  PaymentMethodControllers.addPaymentMethod
);

router.post(
  "/create-setup-intent",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentMethodControllers.createSetupIntent
);

router.post(
  "/ephemeral-key",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentMethodControllers.createEphemeralKey
);

router.get(
  "/",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentMethodControllers.getPaymentMethods
);

router.patch(
  "/:id/default",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentMethodControllers.setDefaultPaymentMethod
);

router.patch(
  "/:id/autopay",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(PaymentMethodValidation.toggleAutoPaySchema),
  PaymentMethodControllers.toggleAutoPay
);

router.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentMethodControllers.deletePaymentMethod
);

export const PaymentMethodRoutes = router;
