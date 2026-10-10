import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import {
  MembershipTier,
  SubscriptionStatus,
  Role,
} from "../user/user.interface";
import { User } from "../user/user.model";
import { Group } from "../group/group.model";
import { GroupStatus } from "../group/group.interface";

export enum MembershipAction {
  CREATE_GROUP = "CREATE_GROUP",
  COMPLETE_ONBOARDING = "COMPLETE_ONBOARDING",
  RECEIVE_COMMISSION = "RECEIVE_COMMISSION",
}

/**
 * Validates if a user can perform a specific action based on their membership tier and status.
 */
export const validateMembershipAction = async (
  userId: string,
  action: MembershipAction
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const { membershipTier, subscriptionStatus, gracePeriodUntil, role } = user;

  // Admins bypass membership gating
  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    return true;
  }

  // 1. Basic Status Gating
  const isExpired = subscriptionStatus === SubscriptionStatus.EXPIRED;
  const isGracePeriod = subscriptionStatus === SubscriptionStatus.GRACE_PERIOD;
  const isGraceExpired =
    isGracePeriod && gracePeriodUntil && new Date() > gracePeriodUntil;

  // Block premium actions if expired or grace period exceeded
  const isBlocked = isExpired || isGraceExpired;

  switch (action) {
    case MembershipAction.CREATE_GROUP: {
      if (membershipTier === MembershipTier.GUEST || isBlocked) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Membership upgrade required to create new groups."
        );
      }

      if (membershipTier === MembershipTier.REGULAR) {
        const activeGroupsCount = await Group.countDocuments({
          createdBy: userId,
          isDeleted: false,
          status: { $nin: [GroupStatus.COMPLETED, GroupStatus.CANCELLED] },
        });

        if (activeGroupsCount >= 1) {
          throw new AppError(
            httpStatus.FORBIDDEN,
            "REGULAR membership is limited to 1 active group. Upgrade to VIP for unlimited groups."
          );
        }
      }
      break;
    }

    case MembershipAction.COMPLETE_ONBOARDING: {
      // All users (including GUEST) must be allowed to complete Stripe onboarding
      // so they can join groups and receive payouts.
      break;
    }

    case MembershipAction.RECEIVE_COMMISSION: {
      if (membershipTier === MembershipTier.GUEST || isBlocked) {
        return false; // Silently fail or handle in logic
      }
      return true;
    }

    default:
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid membership action");
  }

  return true;
};
