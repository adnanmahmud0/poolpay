import { model, models, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { AuthProvider, KYCStatus, IUserDocument, Role, UserStatus, MembershipTier, SubscriptionStatus, VerificationChannel, MembershipProvider } from "./user.interface";
import { encrypt, decrypt } from "../../utils/encryption";
import { normalizePhone, generatePhoneHash, generateStripeCustomerIdHash } from "../../utils/phoneUtils";

const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { 
      type: String, 
      required: function(this: IUserDocument) {
        return !this.googleId && !this.facebookId;
      }, 
      unique: true, 
      sparse: true, 
      index: true 
    },
    phone: {
      type: String,
      required: function(this: IUserDocument) {
        return !this.googleId && !this.facebookId;
      },
      get: decrypt,
      set: encrypt,
    },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, index: true },
    facebookId: { type: String, unique: true, sparse: true, index: true },
    agreeToTerms: { 
      type: Boolean, 
      required: function(this: IUserDocument) {
        return !this.googleId && !this.facebookId;
      },
      default: true 
    },
    agreeToForfeitOnRemoval: {
      type: Boolean,
      default: true
    },
    agreeToSms: {
      type: Boolean,
      default: false
    },

    authProviders: {
      type: [String],
      enum: Object.values(AuthProvider),
      default: [AuthProvider.EMAIL],
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
      index: true,
    },

    profileImage: { type: String },
    dateOfBirth: { type: Date },
    occupation: { type: String },
    streetAddress: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    city: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    state: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    zipCode: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    language: {
      type: String,
      enum: ["English", "Spanish", "French", "Haitian Creole"],
      default: "English",
    },
    fcmToken: { type: String, select: false },
    kycStatus: {
      type: String,
      enum: Object.values(KYCStatus),
      default: KYCStatus.PENDING,
      index: true,
    },
    documentType: { type: String },
    documentUrl: { type: String },

    isVerified: { type: Boolean, default: false, index: true },
    verificationCode: { type: String, index: true, select: false },
    verificationCodeExpires: { type: Date, select: false },
    verificationLastSent: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorEmailCode: { type: String, select: false },
    twoFactorEmailCodeExpires: { type: Date, select: false },
    isUpdatedProfile: { type: Boolean, default: false },
    stripeCustomerId: {
      type: String,
      get: decrypt,
      set: encrypt,
    },
    stripeCustomerIdHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeConnectedAccountId: { type: String, index: true },
    stripeConnectStatus: { type: String, enum: ["verified", "unverified"], default: "unverified" },
    
    // Membership & Subscriptions
    membershipTier: {
      type: String,
      enum: Object.values(MembershipTier),
      default: MembershipTier.GUEST,
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      index: true,
    },
    subscriptionExpiry: { type: Date },
    stripeSubscriptionId: { type: String, unique: true, sparse: true, index: true },
    membershipProvider: {
      type: String,
      enum: Object.values(MembershipProvider),
      index: true,
    },
    platformSubscriptionId: { type: String, unique: true, sparse: true, index: true },
    purchaseToken: { type: String, index: true },
    gracePeriodUntil: { type: Date },
    membershipStartedAt: { type: Date },
    lastBillingDate: { type: Date },
    autoRenewEnabled: { type: Boolean, default: false },
    pendingMembershipTier: {
      type: String,
      enum: Object.values(MembershipTier),
    },
    downgradeDate: { type: Date },

    // Verification & 2FA
    phoneVerified: { type: Boolean, default: false, index: true },
    twoFactorChannel: {
      type: String,
      enum: Object.values(VerificationChannel),
      default: VerificationChannel.EMAIL,
    },
    otpAttempts: { type: Number, default: 0 },
    otpCooldownUntil: { type: Date },

    passwordResetCode: { type: String, select: false },
    passwordResetCodeExpires: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    phoneHash: { type: String, unique: true, sparse: true, index: true },
    phoneConflict: { type: Boolean, default: false },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    validateBeforeSave: true,
    toJSON: {
      getters: true,
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.fcmToken;
        delete ret.verificationCode;
        delete ret.verificationCodeExpires;
        delete ret.twoFactorSecret;
        delete ret.twoFactorEmailCode;
        delete ret.twoFactorEmailCodeExpires;
        delete ret.passwordResetCode;
        delete ret.passwordResetCodeExpires;
        delete ret.stripeCustomerId;
        delete ret.stripeCustomerIdHash;
        delete ret.stripeConnectedAccountId;
        delete ret.stripeSubscriptionId;
        delete ret.platformSubscriptionId;
        delete ret.purchaseToken;
        return ret;
      },
    },
    toObject: {
      getters: true,
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.fcmToken;
        delete ret.verificationCode;
        delete ret.verificationCodeExpires;
        delete ret.twoFactorSecret;
        delete ret.twoFactorEmailCode;
        delete ret.twoFactorEmailCodeExpires;
        delete ret.passwordResetCode;
        delete ret.passwordResetCodeExpires;
        delete ret.stripeCustomerId;
        delete ret.stripeCustomerIdHash;
        delete ret.stripeConnectedAccountId;
        delete ret.stripeSubscriptionId;
        delete ret.platformSubscriptionId;
        delete ret.purchaseToken;
        return ret;
      },
    },
  }
);

// Schema-level validation for at least one identifier
userSchema.pre("validate", function (next) {
  if (!this.email && !this.phone && !this.googleId && !this.facebookId) {
    return next(new Error("At least one identifier (email, phone, googleId, or facebookId) is required."));
  }
  next();
});

// Virtual for fullName
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    if (this.phone) {
      const normalized = normalizePhone(this.phone);
      this.phoneHash = generatePhoneHash(normalized);
    } else {
      this.phoneHash = undefined;
    }
  }
  if (this.isModified("stripeCustomerId")) {
    if (this.stripeCustomerId) {
      this.stripeCustomerIdHash = generateStripeCustomerIdHash(this.stripeCustomerId);
    } else {
      this.stripeCustomerIdHash = undefined;
    }
  }
  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as Record<string, unknown> & { phone?: string; phoneHash?: string; stripeCustomerId?: string; stripeCustomerIdHash?: string };
  if (update) {
    if (update.phone !== undefined) {
      if (update.phone) {
        const normalized = normalizePhone(update.phone);
        update.phoneHash = generatePhoneHash(normalized);
      } else {
        update.phoneHash = undefined;
      }
    }
    if (update.stripeCustomerId !== undefined) {
      if (update.stripeCustomerId) {
        update.stripeCustomerIdHash = generateStripeCustomerIdHash(update.stripeCustomerId);
      } else {
        update.stripeCustomerIdHash = undefined;
      }
    }
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = models.User || model<IUserDocument>("User", userSchema);
