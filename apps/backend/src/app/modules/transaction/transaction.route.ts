import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { TransactionControllers } from "./transaction.controller";
import { TransactionValidation } from "./transaction.validation";

const router = Router();

router.get(
  "/my-transactions",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  TransactionControllers.getMyTransactions
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  TransactionControllers.getAllTransactions
);

router.patch(
  "/:id/flag",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(TransactionValidation.flagTransactionSchema),
  TransactionControllers.flagTransaction
);

router.patch(
  "/:id/freeze",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  TransactionControllers.freezeTransaction
);

export const TransactionRoutes = router;
