import { Types, Document, model, models, Schema } from "mongoose";

export enum FeeType {
  TRANSACTION_FEE = "transaction_fee",
  LATE_FEE = "late_fee",
}

export interface IRevenue {
  transactionId?: Types.ObjectId; // Optional in case of flat fees not tied directly to a single transaction initially
  amount: number;
  feeType: FeeType;
  createdAt?: Date;
  updatedAt?: Date;
  isMock?: boolean;
}

export interface IRevenueDocument extends IRevenue, Document {}

const revenueSchema = new Schema<IRevenueDocument>(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    amount: { type: Number, required: true },
    feeType: {
      type: String,
      enum: Object.values(FeeType),
      required: true,
    },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Revenue =
  models.Revenue || model<IRevenueDocument>("Revenue", revenueSchema);
