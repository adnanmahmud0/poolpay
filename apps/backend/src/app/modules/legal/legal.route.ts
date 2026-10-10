import { Router } from "express";
import { LegalController } from "./legal.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

// Public routes
router.get("/", LegalController.getAllPolicies);
router.get("/:slug", LegalController.getPolicyBySlug);

// Admin-only management
router.put(
  "/:slug",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  LegalController.updatePolicy
);

export const LegalRoutes = router;
