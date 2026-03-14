import { Document, Model, Schema, model } from "mongoose";

export type DepositeType = "on_chain" | "f2f" | "buy_crypto";
export type DepositeNetwork = "TRC20" | "ERC20" | "BEP20";
export type DepositeStatus = "pending" | "approved" | "rejected";

export interface IDeposite extends Document {
  user: Schema.Types.ObjectId;
  amount: number;
  depositeType: DepositeType;
  network?: DepositeNetwork;
  walletAddress?: string;
  screenshot?: string;
  remarks?: string;
  status: DepositeStatus;
  adminRemark?: string;
  reviewedAt?: Date;
  reviewedBy?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IDepositeModel extends Model<IDeposite> {}

const depositeSchema = new Schema<IDeposite>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    depositeType: {
      type: String,
      enum: ["on_chain", "f2f", "buy_crypto"],
      default: "on_chain",
    },
    network: { type: String, enum: ["TRC20", "ERC20", "BEP20"] },
    walletAddress: { type: String },
    screenshot: { type: String },
    remarks: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminRemark: { type: String, trim: true, maxlength: 500 },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Deposite = model<IDeposite, IDepositeModel>("Deposite", depositeSchema);
