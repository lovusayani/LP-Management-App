import { Document, Model, Schema, model } from "mongoose";

export interface ITradeWallet extends Document {
  user: Schema.Types.ObjectId;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ITradeWalletModel extends Model<ITradeWallet> {}

const tradeWalletSchema = new Schema<ITradeWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const TradeWallet = model<ITradeWallet, ITradeWalletModel>("TradeWallet", tradeWalletSchema);
