import { Document, Model, Schema, model } from "mongoose";

export interface IApiSource extends Document {
  name: string;
  baseUrl: string;
  apiKey: string;
  authHeader: "x-api-key" | "bearer";
  isActive: boolean;
  assignedUsers: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface IApiSourceModel extends Model<IApiSource> {}

const apiSourceSchema = new Schema<IApiSource>(
  {
    name: { type: String, required: true, trim: true },
    baseUrl: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, trim: true },
    authHeader: { type: String, enum: ["x-api-key", "bearer"], default: "x-api-key" },
    isActive: { type: Boolean, default: true },
    assignedUsers: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true }
);

export const ApiSource = model<IApiSource, IApiSourceModel>("ApiSource", apiSourceSchema);
