import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { SettingsControllers } from "./settings.controller";
import { SettingsValidation } from "./settings.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SettingsControllers.getSettings
);

router.get(
  "/auth-status",
  checkAuth(...Object.values(Role)),
  SettingsControllers.getAuthSettings
);

router.get(
  "/contact",
  SettingsControllers.getContactSettings
);

router.patch(
  "/update",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(SettingsValidation.updateSettingsSchema),
  SettingsControllers.updateSettings
);

router.patch(
  "/support-email",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(SettingsValidation.updateSupportEmailSchema),
  SettingsControllers.updateSupportEmail
);

router.patch(
  "/environment",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SettingsControllers.toggleEnvironment
);

// Public — no auth. Returns current appEnvironment + active Stripe publishable key.
router.get("/config", SettingsControllers.getAppConfig);

export const SettingsRoutes = router;
