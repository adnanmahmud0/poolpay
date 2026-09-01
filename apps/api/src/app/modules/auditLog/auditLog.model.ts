import { Types, Document, model, models, Schema } from "mongoose";

export enum AuditAction {
  RECOVERY_SUCCESS = "recovery_success",
  RECOVERY_FAIL = "recovery_fail",
  MANUAL_REVIEW_ESCALATED = "manual_review_escalated",
  STRIPE_VERIFICATION = "stripe_verification",
  WEBHOOK_REJECTED = "webhook_rejected",
  RECONCILIATION_MISMATCH = "reconciliation_mismatch",
  PAYOUT_RETRY = "payout_retry",
  PAYMENT_RETRY = "payment_retry",
  ADMIN_ACTION = "admin_action",
  MEMBERSHIP_UPGRADE = "membership_upgrade",
  MEMBERSHIP_DOWNGRADE = "membership_downgrade",
  MEMBERSHIP_CANCEL = "membership_cancel",
  SUBSCRIPTION_EXPIRY = "subscription_expiry",
  RECOVERY_REQUIRED = "recovery_required",
}

export enum EntityType {
  PAYMENT = "payment",
  TURN = "turn",
  USER = "user",
  GROUP = "group",
  SYSTEM = "system",
}

export interface IAuditLog {
  entityType: EntityType;
  entityId: Types.ObjectId | string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    entityType: { type: String, enum: Object.values(EntityType), required: true, index: true },
    entityId: { type: Schema.Types.Mixed, required: true, index: true }, // Can be ObjectId or string
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only by nature
    versionKey: false,
  }
);

export const AuditLog = models.AuditLog || model<IAuditLogDocument>("AuditLog", auditLogSchema);
