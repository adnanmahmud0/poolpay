import { Schema, model, models, Document } from "mongoose";
import { IAdvertisement } from "./advertisement.interface";

export interface IAdvertisementDocument extends IAdvertisement, Document {}

const advertisementSchema = new Schema<IAdvertisementDocument>(
  {
    title: { type: String, required: true },
    description: { type: String },
    bannerImage: { type: String, required: true },
    redirectUrl: { type: String },
    actionType: { 
      type: String, 
      enum: ["none", "link", "email", "phone", "whatsapp"], 
      default: "none" 
    },
    actionValue: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optional: compound index to quickly find active ads
advertisementSchema.index({ isActive: 1, priority: -1, startDate: 1, endDate: 1 });

export const Advertisement = models.Advertisement || model<IAdvertisementDocument>("Advertisement", advertisementSchema);
