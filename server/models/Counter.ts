import { Document, Model, Schema, model } from "mongoose";

export interface ICounter extends Document {
  key: string;
  seq: number;
}

interface ICounterModel extends Model<ICounter> {}

const counterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false }
);

export const Counter = model<ICounter, ICounterModel>("Counter", counterSchema);
