import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { GroupControllers } from "./group.controller";
import { GroupValidation } from "./group.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("groupPhoto"),
  validateRequest(GroupValidation.createGroupSchema),
  GroupControllers.createGroup
);

router.get(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  GroupControllers.getGroupDetails
);

router.get(
  "/invite/:inviteCode",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  GroupControllers.getGroupByInviteCode
);

router.post(
  "/:id/start",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  GroupControllers.startGroup
);

router.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  GroupControllers.deleteGroup
);

export const GroupRoutes = router;
