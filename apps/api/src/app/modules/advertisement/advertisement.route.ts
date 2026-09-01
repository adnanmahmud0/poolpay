import { Router } from "express";
import { AdvertisementControllers } from "./advertisement.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import validateRequest from "../../middlewares/validateRequest";
import { AdvertisementValidation } from "./advertisement.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

// Mobile endpoint (Public or authenticated)
router.get(
  "/active",
  AdvertisementControllers.getActiveAdvertisements
);

// Admin endpoints
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("bannerImage"),
  validateRequest(AdvertisementValidation.createAdvertisementSchema),
  AdvertisementControllers.createAdvertisement
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdvertisementControllers.getAllAdvertisements
);

router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("bannerImage"),
  validateRequest(AdvertisementValidation.updateAdvertisementSchema),
  AdvertisementControllers.updateAdvertisement
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdvertisementControllers.deleteAdvertisement
);

export const AdvertisementRoutes = router;
