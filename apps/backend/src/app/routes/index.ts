import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { GroupRoutes } from "../modules/group/group.route";
import { GroupMemberRoutes } from "../modules/groupMember/groupMember.route";
import { PaymentMethodRoutes } from "../modules/paymentMethod/paymentMethod.route";
import { ChatRoutes } from "../modules/chat/chat.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { TransactionRoutes } from "../modules/transaction/transaction.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { RevenueRoutes } from "../modules/revenue/revenue.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { StripeRoutes } from "../modules/stripe/stripe.route";
import { AdjustmentRoutes } from "../modules/payout/adjustment.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { AdvertisementRoutes } from "../modules/advertisement/advertisement.route";
import { MembershipRoutes } from "../modules/membership/membership.route";
import { MobileMembershipRoutes } from "../modules/mobileMembership/mobileMembership.route";

import {
  authRateLimiter,
  paymentRateLimiter,
} from "../middlewares/rateLimiter";

import { LegalRoutes } from "../modules/legal/legal.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/legal",
    route: LegalRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
    middleware: [authRateLimiter],
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/groups",
    route: GroupRoutes,
  },
  {
    path: "/group-members",
    route: GroupMemberRoutes,
  },
  {
    path: "/payment-methods",
    route: PaymentMethodRoutes,
    middleware: [paymentRateLimiter],
  },
  {
    path: "/payments",
    route: PaymentRoutes,
    middleware: [paymentRateLimiter],
  },
  {
    path: "/chat",
    route: ChatRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes,
  },
  {
    path: "/transactions",
    route: TransactionRoutes,
    middleware: [paymentRateLimiter],
  },
  {
    path: "/revenue",
    route: RevenueRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/stripe",
    route: StripeRoutes,
  },
  {
    path: "/admin/adjustments",
    route: AdjustmentRoutes,
  },
  {
    path: "/advertisements",
    route: AdvertisementRoutes,
  },
  {
    path: "/membership",
    route: MembershipRoutes,
  },
  {
    path: "/mobile-membership",
    route: MobileMembershipRoutes,
  },
];

moduleRoutes.forEach((route) => {
  if (route.middleware) {
    router.use(route.path, ...route.middleware, route.route);
  } else {
    router.use(route.path, route.route);
  }
});
