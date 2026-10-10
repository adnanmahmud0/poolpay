import { User } from "../user/user.model";
import { MembershipTier } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";

const createSubscription = async (
  _userId: string,
  _targetTier: MembershipTier,
  _successUrl?: string,
  _cancelUrl?: string
) => {
  throw new AppError(
    httpStatus.BAD_REQUEST,
    "Stripe web subscriptions are discontinued. Please purchase or manage your subscription directly inside the mobile app using Google Play or Apple App Store In-App Purchases."
  );
};

const cancelSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return {
    message:
      "To cancel your mobile membership, please manage subscriptions directly in your Google Play Store or Apple App Store account settings.",
    membershipProvider: user.membershipProvider,
    membershipTier: user.membershipTier,
  };
};

const toggleAutoRenew = async (userId: string, autoRenew: boolean) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  user.autoRenewEnabled = autoRenew;
  await user.save();

  return {
    autoRenew,
    message:
      "Auto-renew preference updated. For full store subscription management, visit your Google Play / Apple App Store subscription settings.",
  };
};

const getMembershipStatus = async (userId: string) => {
  const user = await User.findById(userId).select(
    "firstName lastName membershipTier subscriptionStatus subscriptionExpiry autoRenewEnabled pendingMembershipTier gracePeriodUntil membershipProvider platformSubscriptionId"
  );
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  return user;
};

export const MembershipServices = {
  createSubscription,
  cancelSubscription,
  toggleAutoRenew,
  getMembershipStatus,
};
