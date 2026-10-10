import { model, models, Model, Schema } from "mongoose";
import {
  DeletionRequestStatus,
  IDeletionRequestDocument,
} from "./deletionRequest.interface";

const deletionRequestSchema = new Schema<IDeletionRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(DeletionRequestStatus),
      default: DeletionRequestStatus.PENDING,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const DeletionRequest =
  (models.DeletionRequest as Model<IDeletionRequestDocument>) ||
  model<IDeletionRequestDocument>("DeletionRequest", deletionRequestSchema);
