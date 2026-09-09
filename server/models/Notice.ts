import { Document, Model, Schema, model } from "mongoose";

export type NoticeTarget = "all" | "user";

export interface INotice extends Document {
  title: string;
  message: string;
  target: NoticeTarget;
  targetUser?: Schema.Types.ObjectId;
  createdBy?: Schema.Types.ObjectId;
  readBy: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface INoticeModel extends Model<INotice> {}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    target: { type: String, enum: ["all", "user"], required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

noticeSchema.index({ target: 1, targetUser: 1, createdAt: -1 });

export const Notice = model<INotice, INoticeModel>("Notice", noticeSchema);
