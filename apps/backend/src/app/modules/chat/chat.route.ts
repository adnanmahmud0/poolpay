import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { ChatControllers } from "./chat.controller";

import { ChatValidation } from "./chat.validation";
import validateRequest from "../../middlewares/validateRequest";

import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get(
  "/group/:groupId/messages",
  checkAuth(...Object.values(Role)),
  ChatControllers.getGroupMessages
);

router.post(
  "/group/:groupId/messages",
  checkAuth(...Object.values(Role)),
  multerUpload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  validateRequest(ChatValidation.sendMessageSchema),
  ChatControllers.sendMessage
);

export const ChatRoutes = router;
