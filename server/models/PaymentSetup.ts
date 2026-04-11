import { Document, Model, Schema, model } from "mongoose";
import { DepositeNetwork } from "./Deposite";

export interface IPaymentNetworkConfig {
  walletAddress?: string;
  qrCodePath?: string;
}

export interface IPaymentSetup extends Document {
  key: string;
  networks: Record<DepositeNetwork, IPaymentNetworkConfig>;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentNetworkSchema = new Schema<IPaymentNetworkConfig>(
  {
    walletAddress: { type: String, trim: true, default: "" },
    qrCodePath: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const paymentSetupSchema = new Schema<IPaymentSetup>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    networks: {
      TRC20: { type: paymentNetworkSchema, default: () => ({}) },
      ERC20: { type: paymentNetworkSchema, default: () => ({}) },
      BEP20: { type: paymentNetworkSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

export const PaymentSetup = model<IPaymentSetup, Model<IPaymentSetup>>("PaymentSetup", paymentSetupSchema);
