import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { updateUserZodSchema, UserValidation } from "./user.validation";
import { multerUpload } from "../../config/multer.config";
import { DeletionRequestControllers } from "../deletionRequest/deletionRequest.controller";
import { DeletionRequestValidation } from "../deletionRequest/deletionRequest.validation";

const router = Router();
router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers
);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);

router.get(
  "/my-stats",
  checkAuth(...Object.values(Role)),
  UserControllers.getMyFinancialStats
);

router.post(
  "/delete-account-request",
  checkAuth(...Object.values(Role)),
  validateRequest(DeletionRequestValidation.createDeletionRequestSchema),
  DeletionRequestControllers.createDeletionRequest
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getSingleUser
);

router.post(
  "/upload-profile-image",
  checkAuth(...Object.values(Role)),
  multerUpload.single("image"),
  UserControllers.uploadProfileImage
);

router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(Role)),
  UserControllers.updateUser
);

router.patch(
  "/:id/suspend",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(UserValidation.suspendUserZodSchema),
  UserControllers.suspendUser
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.deleteUser
);

export const UserRoutes = router;
