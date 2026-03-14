import { Document, Schema, Types, model } from "mongoose";

export interface IPushToken extends Document {
  user: Types.ObjectId;
  token: string;
  platform: "web";
  userAgent?: string;
  lastSeenAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const pushTokenSchema = new Schema<IPushToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, enum: ["web"], default: "web" },
    userAgent: { type: String, trim: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pushTokenSchema.index({ user: 1, token: 1 }, { unique: true });

export const PushToken = model<IPushToken>("PushToken", pushTokenSchema);