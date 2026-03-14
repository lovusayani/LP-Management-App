import { Document, Model, Schema, model } from "mongoose";

export interface IPnlUpload extends Document {
  fileName: string;
  originalName: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: Schema.Types.ObjectId;
  targetUser?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IPnlUploadModel extends Model<IPnlUpload> {}

const pnlUploadSchema = new Schema<IPnlUpload>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true, trim: true },
    fileSize: { type: Number, required: true, min: 0 },
    filePath: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

export const PnlUpload = model<IPnlUpload, IPnlUploadModel>("PnlUpload", pnlUploadSchema);
