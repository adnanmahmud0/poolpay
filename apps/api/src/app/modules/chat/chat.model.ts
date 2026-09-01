import { Types, Document, model, models, Schema } from "mongoose";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  MEDIA = "media",
}

export interface IChatMessage {
  groupId: Types.ObjectId;
  senderId: Types.ObjectId;
  message?: string;
  attachments?: {
    url: string;
    type: "image" | "video";
  }[];
  messageType: MessageType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatMessageDocument extends IChatMessage, Document {}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, required: false },
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          type: { type: String, enum: ["image", "video"], required: true },
        },
      ],
      default: [],
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for group chat history performance
chatMessageSchema.index({ groupId: 1, createdAt: -1 });
chatMessageSchema.index({ createdAt: -1 });

export const ChatMessage = models.ChatMessage || model<IChatMessageDocument>("ChatMessage", chatMessageSchema);
