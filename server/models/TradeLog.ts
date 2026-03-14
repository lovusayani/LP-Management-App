import { Document, Model, Schema, model } from "mongoose";

export type TradeType = "profit" | "loss";

export interface ITradeLog extends Document {
  slId: number;
  tradeId: string;
  lpUser: Schema.Types.ObjectId;
  lpName: string;
  tradeDate: string;
  tradeTime: string;
  tradePair: string;
  tradeVal: number;
  tradeType: TradeType;
  margin: number;
  profit: number;
  oldTradeBal: number;
  currTradeBal: number;
  createdBy?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ITradeLogModel extends Model<ITradeLog> {}

const tradeLogSchema = new Schema<ITradeLog>(
  {
    slId: { type: Number, required: true, unique: true, index: true },
    tradeId: { type: String, required: true, unique: true, index: true },
    lpUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lpName: { type: String, required: true, trim: true },
    tradeDate: { type: String, required: true },
    tradeTime: { type: String, required: true },
    tradePair: { type: String, required: true, trim: true },
    tradeVal: { type: Number, required: true, min: 0 },
    tradeType: { type: String, required: true, enum: ["profit", "loss"] },
    margin: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true, min: 0 },
    oldTradeBal: { type: Number, required: true, min: 0 },
    currTradeBal: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const TradeLog = model<ITradeLog, ITradeLogModel>("TradeLog", tradeLogSchema);
