import { Document, Model, Schema, model } from "mongoose";

export interface IJobRun extends Document<string> {
  runAt: Date;
}

interface IJobRunModel extends Model<IJobRun> {}

const jobRunSchema = new Schema<IJobRun>(
  {
    _id: { type: String, required: true },
    runAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false }
);

export const JobRun = model<IJobRun, IJobRunModel>("JobRun", jobRunSchema);
