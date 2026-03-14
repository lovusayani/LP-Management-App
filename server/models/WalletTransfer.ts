import { Document, Model, Schema, model } from "mongoose";

export type WalletTransferDirection = "main_to_trade" | "trade_to_main";

export interface IWalletTransfer extends Document {
  user: Schema.Types.ObjectId;
  amount: number;
  direction: WalletTransferDirection;
  mainBalanceAfter: number;
  tradeBalanceAfter: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IWalletTransferModel extends Model<IWalletTransfer> {}

const walletTransferSchema = new Schema<IWalletTransfer>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    direction: {
      type: String,
      enum: ["main_to_trade", "trade_to_main"],
      required: true,
      index: true,
    },
    mainBalanceAfter: { type: Number, required: true, min: 0 },
    tradeBalanceAfter: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const WalletTransfer = model<IWalletTransfer, IWalletTransferModel>(
  "WalletTransfer",
  walletTransferSchema
);
