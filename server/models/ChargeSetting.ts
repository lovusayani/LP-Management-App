import { Document, Model, Schema, model } from "mongoose";

export const GLOBAL_CHARGE_SYMBOL = "GLOBAL";

export interface IChargeSetting extends Document {
  symbol: string;
  chargePerStandardLot: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IChargeSettingModel extends Model<IChargeSetting> {}

const chargeSettingSchema = new Schema<IChargeSetting>(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true, unique: true },
    chargePerStandardLot: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const ChargeSetting = model<IChargeSetting, IChargeSettingModel>("ChargeSetting", chargeSettingSchema);
