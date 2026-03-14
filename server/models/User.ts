import bcrypt from "bcryptjs";
import { Document, Model, Schema, model } from "mongoose";

export type Role = "admin" | "lp";
export type UserStatus = "active" | "suspended";
export type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type Theme = "light" | "dark" | "system";

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  withdrawWallet?: {
    walletAddress: string;
    chainType: "TRC20" | "ERC20" | "BEP20";
    currency: "USDT" | "USD" | "INR";
  };
  mainWalletBalance: number;
  lockInBalance: number;
  role: Role;
  status: UserStatus;
  password: string;
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
  kycSubmitted: boolean;
  kycStatus: KycStatus;
  kycDocuments: {
    companyProof?: string;
    panCard?: string;
    aadhaarCard?: string;
    selfie?: string;
  };
  settings: {
    theme: Theme;
    fontSize: number;
    notificationSound: boolean;
    alerts: boolean;
  };
  refreshTokenHash?: string;
  createdBy?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    mainWalletBalance: { type: Number, default: 0, min: 0 },
    lockInBalance: { type: Number, default: 500, min: 0 },
    role: { type: String, enum: ["admin", "lp"], default: "lp" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    password: { type: String, required: true, minlength: 8 },
    mustChangePassword: { type: Boolean, default: true },
    onboardingCompleted: { type: Boolean, default: false },
    kycSubmitted: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    kycDocuments: {
      companyProof: { type: String },
      panCard: { type: String },
      aadhaarCard: { type: String },
      selfie: { type: String },
    },
    withdrawWallet: {
      walletAddress: { type: String, trim: true },
      chainType: { type: String, enum: ["TRC20", "ERC20", "BEP20"] },
      currency: { type: String, enum: ["USDT", "USD", "INR"], default: "USDT" },
    },
    settings: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
      fontSize: { type: Number, default: 16 },
      notificationSound: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true },
    },
    refreshTokenHash: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, IUserModel>("User", userSchema);
