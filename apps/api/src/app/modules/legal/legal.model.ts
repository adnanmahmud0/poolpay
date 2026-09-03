import { Schema, model, models } from "mongoose";
import { ILegalPolicyDocument } from "./legal.interface";

const legalPolicySchema = new Schema<ILegalPolicyDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const LegalPolicy =
  models.LegalPolicy ||
  model<ILegalPolicyDocument>("LegalPolicy", legalPolicySchema);
