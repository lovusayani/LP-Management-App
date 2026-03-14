import { Document, Model, Schema, model } from "mongoose";

export interface IBranding extends Document {
  key: string;
  darkLogoPath?: string;
  lightLogoPath?: string;
  mobileLogoPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IBrandingModel extends Model<IBranding> {}

const brandingSchema = new Schema<IBranding>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    darkLogoPath: { type: String, trim: true },
    lightLogoPath: { type: String, trim: true },
    mobileLogoPath: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Branding = model<IBranding, IBrandingModel>("Branding", brandingSchema);