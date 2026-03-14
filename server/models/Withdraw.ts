import { Document, Model, Schema, model } from "mongoose";

export type WithdrawChain = "TRC20" | "ERC20" | "BEP20";
export type WithdrawCurrency = "USDT" | "USD" | "INR";
export type WithdrawStatus = "processing" | "approved" | "cancelled" | "pending" | "rejected";

export interface IWithdraw extends Document {
  user: Schema.Types.ObjectId;
  txId: string;
  amount: number;
  walletAddress: string;
  chainType: WithdrawChain;
  currency: WithdrawCurrency;
  status: WithdrawStatus;
  adminRemark?: string;
  reviewedAt?: Date;
  reviewedBy?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IWithdrawModel extends Model<IWithdraw> {}

const withdrawSchema = new Schema<IWithdraw>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    txId: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    walletAddress: { type: String, required: true, trim: true },
    chainType: { type: String, enum: ["TRC20", "ERC20", "BEP20"], required: true },
    currency: { type: String, enum: ["USDT", "USD", "INR"], default: "USDT" },
    status: {
      type: String,
      enum: ["processing", "approved", "cancelled", "pending", "rejected"],
      default: "processing",
      index: true,
    },
    adminRemark: { type: String, trim: true, maxlength: 500 },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Withdraw = model<IWithdraw, IWithdrawModel>("Withdraw", withdrawSchema);
