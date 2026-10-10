import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { MembershipControllers } from "./membership.controller";
import { MembershipValidations } from "./membership.validation";

const router = Router();

router.post(
  "/subscribe",
  checkAuth(Role.USER),
  validateRequest(MembershipValidations.createSubscriptionSchema),
  MembershipControllers.createSubscription
);

router.post(
  "/cancel",
  checkAuth(Role.USER),
  MembershipControllers.cancelSubscription
);

router.post(
  "/toggle-auto-renew",
  checkAuth(Role.USER),
  validateRequest(MembershipValidations.toggleAutoRenewSchema),
  MembershipControllers.toggleAutoRenew
);

router.get(
  "/status",
  checkAuth(Role.USER),
  MembershipControllers.getMembershipStatus
);

export const MembershipRoutes = router;
