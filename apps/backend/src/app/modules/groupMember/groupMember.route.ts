import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { GroupMemberControllers } from "./groupMember.controller";
import { GroupValidation } from "../group/group.validation";
import { GroupMemberValidation } from "./groupMember.validation";

const router = Router();

router.get(
  "/my-groups",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  GroupMemberControllers.getMyGroups
);

router.post(
  "/join",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GroupValidation.joinGroupSchema),
  GroupMemberControllers.joinGroup
);

router.get(
  "/:groupId",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  GroupMemberControllers.getGroupMembers
);

router.patch(
  "/:id/notice",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GroupMemberValidation.markNoticeSchema),
  GroupMemberControllers.markNotice
);

router.patch(
  "/:id/remove",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GroupMemberValidation.removeMemberSchema),
  GroupMemberControllers.removeMember
);

export const GroupMemberRoutes = router;
