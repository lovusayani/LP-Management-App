import { Document, Model, Schema, model } from "mongoose";

export const GLOBAL_CHARGE_SYMBOL = "GLOBAL";

export interface IChargeSetting extends Document {
  user: Schema.Types.ObjectId | null;
  symbol: string;
  chargePerStandardLot: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IChargeSettingModel extends Model<IChargeSetting> {}

const chargeSettingSchema = new Schema<IChargeSetting>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    chargePerStandardLot: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

chargeSettingSchema.index({ user: 1, symbol: 1 }, { unique: true });

export const ChargeSetting = model<IChargeSetting, IChargeSettingModel>("ChargeSetting", chargeSettingSchema);
