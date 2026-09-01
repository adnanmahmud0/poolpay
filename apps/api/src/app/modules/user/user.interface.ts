import { Types, Document } from "mongoose";

export enum Role {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum UserStatus {
  PENDING = "pending",
  ACTIVE = "active",
  BLOCKED = "blocked",
  SUSPENDED = "suspended",
}

export enum AuthProvider {
  EMAIL = "email",
  GOOGLE = "google",
  FACEBOOK = "facebook",
  FIREBASE = "firebase",
}

export enum KYCStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export enum MembershipTier {
  GUEST = "guest",
  REGULAR = "regular",
  VIP = "vip",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  GRACE_PERIOD = "grace_period",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum VerificationChannel {
  EMAIL = "email",
  SMS = "sms",
}

export enum MembershipProvider {
  GOOGLE_PLAY = "google_play",
  APPLE_STORE = "apple_store",
}

export interface IUser {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  googleId?: string;
  facebookId?: string;
  firebaseUid?: string;
  agreeToTerms: boolean;
  agreeToForfeitOnRemoval: boolean;
  agreeToSms: boolean;
  
  authProviders: AuthProvider[];
  role: Role;
  status: UserStatus;
  
  profileImage?: string;
  dateOfBirth?: Date;
  occupation?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  language?: string;
  
  kycStatus: KYCStatus;
  documentType?: string;
  documentUrl?: string;

  // Verification & 2FA Fields
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  verificationLastSent?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorEmailCode?: string;
  twoFactorEmailCodeExpires?: Date;
  isUpdatedProfile: boolean;

  // Password Reset
  passwordResetCode?: string;
  passwordResetCodeExpires?: Date;
  failedLoginAttempts?: number;
  lockoutUntil?: Date;
  
  stripeCustomerId?: string;
  stripeCustomerIdHash?: string;
  stripeConnectedAccountId?: string;
  stripeConnectStatus: "verified" | "unverified";
  
  // Membership & Subscriptions (Native Google Play & Apple Store IAP)
  membershipTier: MembershipTier;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiry?: Date;
  membershipProvider?: MembershipProvider;
  platformSubscriptionId?: string;
  purchaseToken?: string;
  gracePeriodUntil?: Date;
  membershipStartedAt?: Date;
  lastBillingDate?: Date;
  autoRenewEnabled: boolean;
  pendingMembershipTier?: MembershipTier;
  downgradeDate?: Date;

  // Verification & 2FA
  phoneVerified: boolean;
  twoFactorChannel?: VerificationChannel;
  otpAttempts: number;
  otpCooldownUntil?: Date;

  fcmToken?: string;
  phoneHash?: string;
  phoneConflict?: boolean;
  
  isMock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends Omit<IUser, "_id">, Document {
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
