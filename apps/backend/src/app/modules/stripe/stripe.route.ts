import { Router } from "express";
import { StripeControllers } from "./stripe.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

router.post(
  "/connect/account-link",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  StripeControllers.createAccountLink
);

router.get(
  "/connect/status",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  StripeControllers.getConnectStatus
);

router.get(
  "/connect/login-link",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  StripeControllers.createLoginLink
);

router.delete(
  "/connect/unlink",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  StripeControllers.unlinkAccount
);

router.get("/connect/redirect/:type", StripeControllers.handleRedirect);

export const StripeRoutes = router;
