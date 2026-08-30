import { Document, Model, Schema, model } from "mongoose";

export interface IWalletDailySummary extends Document {
  user: Schema.Types.ObjectId;
  date: string;
  oldBalance: number;
  charges: number;
  profit: number;
  loss: number;
  newBalance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IWalletDailySummaryModel extends Model<IWalletDailySummary> {}

const walletDailySummarySchema = new Schema<IWalletDailySummary>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    oldBalance: { type: Number, required: true },
    charges: { type: Number, required: true, default: 0 },
    profit: { type: Number, required: true, default: 0 },
    loss: { type: Number, required: true, default: 0 },
    newBalance: { type: Number, required: true },
  },
  { timestamps: true }
);

walletDailySummarySchema.index({ user: 1, date: 1 }, { unique: true });

export const WalletDailySummary = model<IWalletDailySummary, IWalletDailySummaryModel>(
  "WalletDailySummary",
  walletDailySummarySchema
);
