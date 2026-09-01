import { Types, Document, model, models, Schema } from "mongoose";
import { encrypt, decrypt } from "../../utils/encryption";

export enum PaymentMethodType {
  CARD = "card",
  BANK = "bank",
}

export enum PaymentMethodStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface IPaymentMethod {
  userId: Types.ObjectId;
  stripeCustomerId: string;
  paymentMethodId: string;
  type: PaymentMethodType;
  brand: string;
  last4: string;
  bankName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  country?: string;
  status: PaymentMethodStatus;
  isDefault: boolean;
  autoPayEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentMethodDocument extends IPaymentMethod, Document {}

const paymentMethodSchema = new Schema<IPaymentMethodDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: {
      type: String,
      required: true,
      get: decrypt,
      set: encrypt,
    },
    paymentMethodId: {
      type: String,
      required: true,
      get: decrypt,
      set: encrypt,
    },
    type: {
      type: String,
      enum: Object.values(PaymentMethodType),
      required: true,
    },
    brand: { type: String, required: true },
    last4: { type: String, required: true },
    bankName: { type: String },
    expiryMonth: { type: Number },
    expiryYear: { type: Number },
    country: { type: String },
    status: {
      type: String,
      enum: Object.values(PaymentMethodStatus),
      default: PaymentMethodStatus.ACTIVE,
    },
    isDefault: { type: Boolean, default: false },
    autoPayEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      getters: true,
      transform: function (_doc: unknown, ret: Record<string, unknown>) {
        delete ret.stripeCustomerId;
        delete ret.paymentMethodId;
        return ret;
      },
    },
    toObject: {
      getters: true,
      transform: function (_doc: unknown, ret: Record<string, unknown>) {
        delete ret.stripeCustomerId;
        delete ret.paymentMethodId;
        return ret;
      },
    },
  }
);

// Indexes for performance
paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });

export const PaymentMethod = models.PaymentMethod || model<IPaymentMethodDocument>("PaymentMethod", paymentMethodSchema);
