import { AdminAnalyticsServices } from "./admin.analytics.service";
import { AdminUserServices } from "./admin.user.service";
import { AdminGroupServices } from "./admin.group.service";
import { AdminPaymentServices } from "./admin.payment.service";
import { AdminSystemServices } from "./admin.system.service";

export const AdminServices = {
  ...AdminAnalyticsServices,
  ...AdminUserServices,
  ...AdminGroupServices,
  ...AdminPaymentServices,
  ...AdminSystemServices,
};
