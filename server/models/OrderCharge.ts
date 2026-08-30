import { Document, Model, Schema, model } from "mongoose";

export interface IOrderCharge extends Document {
  tradeId: string;
  source: string;
  account: string;
  symbol: string;
  position: "Buy" | "Sell";
  lotSize: number;
  chargePerStandardLot: number;
  chargeAmount: number;
  orderDate: string;
  openDatetime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IOrderChargeModel extends Model<IOrderCharge> {}

const orderChargeSchema = new Schema<IOrderCharge>(
  {
    tradeId: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true },
    account: { type: String, required: true },
    symbol: { type: String, required: true, uppercase: true },
    position: { type: String, enum: ["Buy", "Sell"], required: true },
    lotSize: { type: Number, required: true, min: 0 },
    chargePerStandardLot: { type: Number, required: true, min: 0 },
    chargeAmount: { type: Number, required: true, min: 0 },
    orderDate: { type: String, required: true, index: true },
    openDatetime: { type: Date, required: true },
  },
  { timestamps: true }
);

export const OrderCharge = model<IOrderCharge, IOrderChargeModel>("OrderCharge", orderChargeSchema);
