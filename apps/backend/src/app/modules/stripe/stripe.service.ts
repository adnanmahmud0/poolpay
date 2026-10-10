import { stripe } from "../../config/stripe.config";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import {
  validateMembershipAction,
  MembershipAction,
} from "../membership/membership.utils";

const createAccountLink = async (
  userId: string,
  returnUrl?: string,
  refreshUrl?: string
) => {
  // Membership Gating
  await validateMembershipAction(userId, MembershipAction.COMPLETE_ONBOARDING);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let accountId = user.stripeConnectedAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      individual: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
      },
      business_profile: {
        product_description: "Community-based savings and group payouts",
      },
      metadata: {
        userId: user._id.toString(),
      },
    });
    accountId = account.id;
    user.stripeConnectedAccountId = accountId;
    await user.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${envVars.BACKEND_URL}/api/v1/stripe/connect/redirect/refresh?userId=${userId}${refreshUrl ? `&customUrl=${encodeURIComponent(refreshUrl)}` : ""}`,
    return_url: `${envVars.BACKEND_URL}/api/v1/stripe/connect/redirect/return?userId=${userId}${returnUrl ? `&customUrl=${encodeURIComponent(returnUrl)}` : ""}`,
    type: "account_onboarding",
  });

  return accountLink.url;
};

const getConnectStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.stripeConnectedAccountId) {
    return { connected: false };
  }

  const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);

  const isConnected = account.charges_enabled && account.payouts_enabled;

  if (isConnected && user.stripeConnectStatus !== "verified") {
    user.stripeConnectStatus = "verified";
    await user.save();
  }

  return {
    connected: !!isConnected,
    details: {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      currently_due: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
      errors: account.requirements?.errors || [],
    },
  };
};

const createLoginLink = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.stripeConnectedAccountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User has no connected account or onboarding is not complete"
    );
  }

  const loginLink = await stripe.accounts.createLoginLink(
    user.stripeConnectedAccountId
  );
  return loginLink.url;
};

const unlinkAccount = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  user.stripeConnectedAccountId = undefined;
  user.stripeConnectStatus = "unverified";
  await user.save();

  return { message: "Stripe account unlinked successfully" };
};

export const StripeServices = {
  createAccountLink,
  getConnectStatus,
  createLoginLink,
  unlinkAccount,
};
