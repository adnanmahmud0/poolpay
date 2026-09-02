import { Types, Document, model, models, Schema } from "mongoose";
export interface ISettings {
  key: string;
  platformName: string;
  transactionFeePercent: number;
  creatorCommissionPercent: number;
  platformCommissionPercent: number;
  sessionTimeoutMinutes: number;
  lateFeePercent: number;
  gracePeriodDays: number;
  maxRetryCount: number;
  minimumStripeBalance: number;
  minContribution: number;
  maxContribution: number;
  supportEmail: string;
  supportPhone?: string;
  supportWhatsapp?: string;
  isUserRegistrationEnabled: boolean;
  isSocialLoginEnabled: boolean;
  isTwoFactorAuthenticationEnabled: boolean;
  isEmailNotificationEnabled: boolean;
  isSMSNotificationEnabled: boolean;
  isPushNotificationEnabled: boolean;
  lastLowBalanceAlertSentAt?: Date;
  updatedBy?: Types.ObjectId;
  isMock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISettingsDocument extends ISettings, Document {}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    key: { type: String, default: "global", unique: true, index: true },
    platformName: { type: String, default: "PoolPay" },
    transactionFeePercent: { type: Number, default: 5 },
    creatorCommissionPercent: { type: Number, default: 1 },
    platformCommissionPercent: { type: Number, default: 1 },
    sessionTimeoutMinutes: { type: Number, default: 20 },
    gracePeriodDays: { type: Number, default: 7 },
    maxRetryCount: { type: Number, default: 3 },
    minimumStripeBalance: { type: Number, default: 500 },
    minContribution: { type: Number, default: 50 },
    maxContribution: { type: Number, default: 10000 },
    lateFeePercent: { type: Number, default: 3 },
    supportEmail: { type: String, default: "support@poolpay.space" },
    supportPhone: { type: String, default: "+16079004569" },
    supportWhatsapp: { type: String, default: "+16079004569" },
    isUserRegistrationEnabled: { type: Boolean, default: true },
    isSocialLoginEnabled: { type: Boolean, default: true },
    isTwoFactorAuthenticationEnabled: { type: Boolean, default: true },
    isEmailNotificationEnabled: { type: Boolean, default: true },
    isSMSNotificationEnabled: { type: Boolean, default: false },
    isPushNotificationEnabled: { type: Boolean, default: true },
    lastLowBalanceAlertSentAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Settings = models.Settings || model<ISettingsDocument>("Settings", settingsSchema);
