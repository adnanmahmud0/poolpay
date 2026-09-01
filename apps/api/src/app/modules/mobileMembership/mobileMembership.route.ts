import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { MobileMembershipControllers } from "./mobileMembership.controller";
import { MobileMembershipValidations } from "./mobileMembership.validation";

const router = Router();

router.post(
  "/verify-google",
  checkAuth(Role.USER),
  validateRequest(MobileMembershipValidations.verifyGoogleSchema),
  MobileMembershipControllers.verifyGooglePurchase
);

router.post(
  "/verify-apple",
  checkAuth(Role.USER),
  validateRequest(MobileMembershipValidations.verifyAppleSchema),
  MobileMembershipControllers.verifyApplePurchase
);

router.post(
  "/sync",
  checkAuth(Role.USER),
  MobileMembershipControllers.syncSubscriptionStatus
);

router.get(
  "/status",
  checkAuth(Role.USER),
  MobileMembershipControllers.getMembershipStatus
);

export const MobileMembershipRoutes = router;
