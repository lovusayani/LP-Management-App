import { Request, Response } from "express";
import fs from "fs";
import path from "path";

import { Branding } from "../models/Branding";
import { Counter } from "../models/Counter";
import { Deposite, DepositeStatus } from "../models/Deposite";
import { PageContent, PageSlug } from "../models/PageContent";
import { PaymentSetup } from "../models/PaymentSetup";
import { PushToken } from "../models/PushToken";
import { TradeLog, TradeType } from "../models/TradeLog";
import { TradeWallet } from "../models/TradeWallet";
import { User } from "../models/User";
import { Withdraw } from "../models/Withdraw";
import { storageService } from "../services/storage.service";
import {
  isPushNotificationConfigured,
  sendPushNotificationToTokens,
} from "../services/push-notification.service";
import { asyncHandler } from "../utils/asyncHandler";

type BrandingLogoVariant = "dark" | "light" | "mobile";

const BRANDING_DIMENSIONS: Record<BrandingLogoVariant, { width: number; height: number }> = {
  dark: { width: 270, height: 74 },
  light: { width: 270, height: 74 },
  mobile: { width: 180, height: 62 },
};

const readPngDimensions = (filePath: string): { width: number; height: number } => {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24) {
    throw new Error("Invalid PNG file");
  }

  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error("Invalid PNG file");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const resolveLogoPath = (publicPath?: string): string => {
  if (!publicPath) {
    return "";
  }

  const relativePath = publicPath.replace(/^\//, "");
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.existsSync(absolutePath) ? publicPath : "";
};

const toBrandingPayload = (branding?: { darkLogoPath?: string; lightLogoPath?: string; mobileLogoPath?: string } | null) => ({
  darkLogoPath: resolveLogoPath(branding?.darkLogoPath),
  lightLogoPath: resolveLogoPath(branding?.lightLogoPath),
  mobileLogoPath: resolveLogoPath(branding?.mobileLogoPath),
});

const resolvePublicPath = (publicPath?: string): string => {
  if (!publicPath) {
    return "";
  }

  const relativePath = publicPath.replace(/^\//, "");
  const absolutePath = path.join(process.cwd(), relativePath);
  return fs.existsSync(absolutePath) ? publicPath : "";
};

const deletePublicFile = (publicPath?: string): void => {
  if (!publicPath) {
    return;
  }

  const relativePath = publicPath.replace(/^\//, "");
  const absolutePath = path.join(process.cwd(), relativePath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const DEFAULT_PAYMENT_SETUP = {
  key: "default",
  networks: {
    TRC20: { walletAddress: "", qrCodePath: "" },
    ERC20: { walletAddress: "", qrCodePath: "" },
    BEP20: { walletAddress: "", qrCodePath: "" },
  },
};

const toPaymentSetupPayload = (paymentSetup?: {
  networks?: {
    TRC20?: { walletAddress?: string; qrCodePath?: string };
    ERC20?: { walletAddress?: string; qrCodePath?: string };
    BEP20?: { walletAddress?: string; qrCodePath?: string };
  };
} | null) => ({
  networks: {
    TRC20: {
      walletAddress: paymentSetup?.networks?.TRC20?.walletAddress || "",
      qrCodePath: resolvePublicPath(paymentSetup?.networks?.TRC20?.qrCodePath),
    },
    ERC20: {
      walletAddress: paymentSetup?.networks?.ERC20?.walletAddress || "",
      qrCodePath: resolvePublicPath(paymentSetup?.networks?.ERC20?.qrCodePath),
    },
    BEP20: {
      walletAddress: paymentSetup?.networks?.BEP20?.walletAddress || "",
      qrCodePath: resolvePublicPath(paymentSetup?.networks?.BEP20?.qrCodePath),
    },
  },
});

const getNextSequence = async (key: string): Promise<number> => {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return counter.seq;
};

const getTradeDateTimeParts = (now: Date) => {
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return {
    tradeDate: `${day}-${month}-${year}`,
    tradeTime: `${hours}:${minutes}:${seconds}`,
    compact: `${day}${month}${year}${hours}${minutes}`,
  };
};

const ensureTradeWallet = async (userId: string, seedBalance = 0) => {
  let tradeWallet = await TradeWallet.findOne({ user: userId });
  if (!tradeWallet) {
    tradeWallet = await TradeWallet.create({
      user: userId,
      balance: Number(seedBalance.toFixed(2)),
    });
  }

  return tradeWallet;
};

const toTradePayload = (item: {
  _id?: unknown;
  slId: number;
  tradeId: string;
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
  createdAt?: Date;
}) => ({
  id: String(item._id || ""),
  sl_id: item.slId,
  trade_id: item.tradeId,
  LP_name: item.lpName,
  trade_date: item.tradeDate,
  trade_time: item.tradeTime,
  trade_pair: item.tradePair,
  trade_val: item.tradeVal,
  trade_type: item.tradeType,
  margin: item.margin,
  profit: item.profit,
  old_trade_bal: item.oldTradeBal,
  curr_trade_bal: item.currTradeBal,
  createdAt: item.createdAt,
});

export const createLpUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error("User with this email already exists");
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone,
    password,
    role: "lp",
    mustChangePassword: true,
    createdBy: req.user?._id,
  });

  return res.status(201).json({
    message: "LP user created",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      lockInBalance: user.lockInBalance,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
    },
  });
});

export const getAllLpUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({ role: "lp" }).select(
    "fullName email phone status onboardingCompleted kycSubmitted kycStatus kycDocuments lockInBalance mainWalletBalance settings createdAt"
  );

  const userIds = users.map((item) => String(item._id));
  const userObjectIds = users.map((item) => item._id);
  const wallets = await TradeWallet.find({ user: { $in: userIds } }).select("user balance").lean();
  const walletMap = new Map(wallets.map((wallet) => [String(wallet.user), Number(wallet.balance || 0)]));
  const latestTradeBalances = await TradeLog.aggregate([
    { $match: { lpUser: { $in: userObjectIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$lpUser", currTradeBal: { $first: "$currTradeBal" } } },
  ]);
  const latestTradeMap = new Map(
    latestTradeBalances.map((item: { _id: unknown; currTradeBal: number }) => [
      String(item._id),
      Number(item.currTradeBal || 0),
    ])
  );

  const records = users.map((item) => {
    const obj = item.toObject();
    const userId = String(item._id);
    const tradeWalletBalance = latestTradeMap.has(userId)
      ? Number(latestTradeMap.get(userId) || 0)
      : Number(walletMap.get(userId) ?? 0);

    return {
      ...obj,
      tradeWalletBalance,
    };
  });

  return res.json({ users: records });
});

export const updateLpUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  const user = await User.findById(id);
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  user.password = password;
  user.mustChangePassword = true;
  await user.save();

  return res.json({ message: "User password updated" });
});

export const reviewKyc = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { kycStatus } = req.body;

  if (!["approved", "rejected", "pending"].includes(kycStatus)) {
    res.status(400);
    throw new Error("Invalid KYC status");
  }

  const user = await User.findById(id);
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  user.kycStatus = kycStatus;
  user.kycSubmitted = user.kycDocuments ? true : false;
  await user.save();

  return res.json({ message: `KYC marked as ${kycStatus}` });
});

export const changeUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const user = await User.findById(id);
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  user.status = status;
  await user.save();

  return res.json({ message: `User status changed to ${status}` });
});

export const updateLpUserLockInBalance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const lockInBalance = Number(req.body.lockInBalance);

  if (!Number.isFinite(lockInBalance) || lockInBalance < 0) {
    res.status(400);
    throw new Error("Invalid lock in balance");
  }

  const user = await User.findById(id);
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  user.lockInBalance = Number(lockInBalance.toFixed(2));
  await user.save();

  return res.json({ message: "Lock in balance updated" });
});

export const adjustLpMainBalance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const action = String(req.body.action || "").trim().toLowerCase();
  const category = String(req.body.category || "").trim();
  const note = String(req.body.note || "").trim();
  const amount = Number(req.body.amount);

  if (!["credit", "debit"].includes(action)) {
    res.status(400);
    throw new Error("Invalid action. Use credit or debit");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400);
    throw new Error("Invalid amount");
  }

  if (!category) {
    res.status(400);
    throw new Error("Category is required");
  }

  const user = await User.findById(id);
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  const current = Number(user.mainWalletBalance || 0);
  if (action === "debit" && current < amount) {
    res.status(400);
    throw new Error("Insufficient main wallet balance for deduction");
  }

  const nextBalance = action === "credit"
    ? Number((current + amount).toFixed(2))
    : Number((current - amount).toFixed(2));

  user.mainWalletBalance = nextBalance;
  await user.save();

  return res.json({
    message: action === "credit" ? "Main balance credited" : "Main balance deducted",
    user: {
      id: String(user._id),
      fullName: user.fullName,
      mainWalletBalance: Number(user.mainWalletBalance || 0),
    },
    adjustment: {
      action,
      amount: Number(amount.toFixed(2)),
      category,
      note,
    },
  });
});

export const createTradeLog = asyncHandler(async (req: Request, res: Response) => {
  const { lpUserId, tradePair, tradeVal, tradeType, margin } = req.body as {
    lpUserId: string;
    tradePair: string;
    tradeVal: number;
    tradeType: TradeType;
    margin: number;
  };

  const lpUser = await User.findById(lpUserId);
  if (!lpUser || lpUser.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  const tradeValue = Number(tradeVal);
  const marginPercent = Number(margin);
  if (!Number.isFinite(tradeValue) || tradeValue < 0 || !Number.isFinite(marginPercent) || marginPercent < 0) {
    res.status(400);
    throw new Error("Invalid trade values");
  }

  const tradeWallet = await ensureTradeWallet(String(lpUser._id), Number(lpUser.lockInBalance || 0));
  const oldTradeBal = Number(tradeWallet.balance || 0);
  if (tradeValue > oldTradeBal) {
    res.status(400);
    throw new Error("Trade amount cannot be greater than LP trade wallet balance");
  }

  if (oldTradeBal <= 0 && tradeValue > 0) {
    res.status(400);
    throw new Error("NO trade wallet balance the LP have. Please select another LP");
  }

  const pnlAmount = Number(((tradeValue * marginPercent) / 100).toFixed(2));
  const tradeResultBal =
    tradeType === "profit"
      ? Number((tradeValue + pnlAmount).toFixed(2))
      : Number(Math.max(tradeValue - pnlAmount, 0).toFixed(2));
  const oldRestWalletBal = Number(Math.max(oldTradeBal - tradeValue, 0).toFixed(2));
  const currTradeBal = Number((tradeResultBal + oldRestWalletBal).toFixed(2));

  const slId = await getNextSequence("trade_log_sl_id");
  const now = new Date();
  const { tradeDate, tradeTime, compact } = getTradeDateTimeParts(now);
  const rand = Math.random().toString(36).slice(2, 5);
  const tradeId = `lmxtrd_${compact}_${rand}`;

  const created = await TradeLog.create({
    slId,
    tradeId,
    lpUser: lpUser._id,
    lpName: lpUser.fullName,
    tradeDate,
    tradeTime,
    tradePair: String(tradePair || "").toUpperCase(),
    tradeVal: Number(tradeValue.toFixed(2)),
    tradeType,
    margin: Number(marginPercent.toFixed(2)),
    profit: pnlAmount,
    oldTradeBal: Number(oldTradeBal.toFixed(2)),
    currTradeBal,
    createdBy: req.user?._id,
  });

  tradeWallet.balance = currTradeBal;
  await tradeWallet.save();

  return res.status(201).json({
    message: "Trade data stored",
    trade: toTradePayload(created.toObject()),
  });
});

export const getAllTradeLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    TradeLog.countDocuments(),
    TradeLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return res.json({
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    records: items.map((item) =>
      toTradePayload({
        _id: item._id,
        slId: item.slId,
        tradeId: item.tradeId,
        lpName: item.lpName,
        tradeDate: item.tradeDate,
        tradeTime: item.tradeTime,
        tradePair: item.tradePair,
        tradeVal: item.tradeVal,
        tradeType: item.tradeType,
        margin: item.margin,
        profit: item.profit,
        oldTradeBal: item.oldTradeBal,
        currTradeBal: item.currTradeBal,
        createdAt: item.createdAt,
      })
    ),
  });
});

export const getAllDeposites = asyncHandler(async (_req: Request, res: Response) => {
  const records = await Deposite.find()
    .populate("user", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    records: records.map((item) => ({
      id: item._id,
      amount: item.amount,
      depositeType: item.depositeType,
      network: item.network,
      walletAddress: item.walletAddress,
      screenshot: item.screenshot,
      remarks: item.remarks,
      status: item.status,
      adminRemark: item.adminRemark,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
      user: {
        id:
          item.user && typeof item.user === "object"
            ? String((item.user as Record<string, unknown>)._id ?? (item.user as Record<string, unknown>).id ?? "")
            : undefined,
        fullName:
          item.user && typeof item.user === "object" && "fullName" in item.user
            ? (item.user.fullName as string)
            : "",
        email:
          item.user && typeof item.user === "object" && "email" in item.user
            ? (item.user.email as string)
            : "",
      },
    })),
  });
});

export const getDepositeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await Deposite.findById(id).populate("user", "fullName email mainWalletBalance").lean();
  if (!item) {
    res.status(404);
    throw new Error("Deposite not found");
  }

  return res.json({
    deposite: {
      id: item._id,
      amount: item.amount,
      depositeType: item.depositeType,
      network: item.network,
      walletAddress: item.walletAddress,
      screenshot: item.screenshot,
      remarks: item.remarks,
      status: item.status,
      adminRemark: item.adminRemark,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
      user: {
        id:
          item.user && typeof item.user === "object"
            ? String((item.user as Record<string, unknown>)._id ?? (item.user as Record<string, unknown>).id ?? "")
            : undefined,
        fullName:
          item.user && typeof item.user === "object" && "fullName" in item.user
            ? (item.user.fullName as string)
            : "",
        email:
          item.user && typeof item.user === "object" && "email" in item.user
            ? (item.user.email as string)
            : "",
        mainWalletBalance:
          item.user && typeof item.user === "object" && "mainWalletBalance" in item.user
            ? (item.user.mainWalletBalance as number)
            : 0,
      },
    },
  });
});

export const reviewDeposite = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const status = String(req.body.status || "") as DepositeStatus;
  const adminRemark = String(req.body.adminRemark || "").trim();

  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error("Invalid deposite review status");
  }

  const deposite = await Deposite.findById(id);
  if (!deposite) {
    res.status(404);
    throw new Error("Deposite not found");
  }

  if (deposite.status !== "pending") {
    res.status(400);
    throw new Error("Deposite already processed");
  }

  if (status === "approved") {
    await User.findByIdAndUpdate(deposite.user, {
      $inc: { mainWalletBalance: deposite.amount },
    });
  }

  deposite.status = status;
  deposite.adminRemark = adminRemark;
  deposite.reviewedAt = new Date();
  deposite.reviewedBy = req.user._id as never;
  await deposite.save();

  return res.json({ message: `Deposite ${status}` });
});

export const getNotificationOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [totalLpUsers, usersWithPushEnabled, totalTokens] = await Promise.all([
    User.countDocuments({ role: "lp" }),
    User.countDocuments({ role: "lp", "settings.alerts": true }),
    PushToken.countDocuments(),
  ]);

  return res.json({
    serverConfigured: isPushNotificationConfigured(),
    totalLpUsers,
    usersWithPushEnabled,
    totalTokens,
  });
});

export const setUserPushPreference = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const enabled = Boolean(req.body.enabled);

  const user = await User.findById(id);
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  user.settings.alerts = enabled;
  await user.save();

  if (!enabled) {
    await PushToken.deleteMany({ user: user._id });
  }

  const tokenCount = await PushToken.countDocuments({ user: user._id });

  return res.json({
    message: enabled ? "Push enabled for user" : "Push disabled for user",
    enabled,
    tokenCount,
  });
});

export const sendPushToAllUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!isPushNotificationConfigured()) {
    res.status(400);
    throw new Error("Push notification server config is missing");
  }

  const title = typeof req.body.title === "string" && req.body.title.trim()
    ? req.body.title.trim()
    : "L Max Update";
  const body = typeof req.body.body === "string" && req.body.body.trim()
    ? req.body.body.trim()
    : "You have a new notification.";
  const url = typeof req.body.url === "string" && req.body.url.trim()
    ? req.body.url.trim()
    : "/dashboard";

  const enabledUsers = await User.find({ role: "lp", "settings.alerts": true }).select("_id").lean();
  const enabledUserIds = enabledUsers.map((item) => item._id);
  const tokenDocs = await PushToken.find({ user: { $in: enabledUserIds } }).select("token").lean();
  const tokens = tokenDocs.map((item) => item.token).filter(Boolean);

  if (tokens.length === 0) {
    res.status(400);
    throw new Error("No registered push tokens found for enabled users");
  }

  const result = await sendPushNotificationToTokens(tokens, {
    notification: { title, body },
    data: {
      title,
      body,
      url,
      type: "admin_broadcast",
    },
    webpush: {
      fcmOptions: { link: url },
    },
  });

  if (!result) {
    res.status(500);
    throw new Error("Firebase messaging service is not available");
  }

  const invalidTokens: string[] = [];
  result.responses.forEach((item, index) => {
    if (item.success) {
      return;
    }

    const code = item.error?.code || "";
    if (
      code.includes("registration-token-not-registered") ||
      code.includes("invalid-registration-token")
    ) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length > 0) {
    await PushToken.deleteMany({ token: { $in: invalidTokens } });
  }

  return res.json({
    message: "Push sent to all enabled users",
    requested: tokens.length,
    successCount: result.successCount,
    failureCount: result.failureCount,
    removedInvalidTokens: invalidTokens.length,
  });
});

export const sendPushToSingleUser = asyncHandler(async (req: Request, res: Response) => {
  if (!isPushNotificationConfigured()) {
    res.status(400);
    throw new Error("Push notification server config is missing");
  }

  const { id } = req.params;
  const user = await User.findById(id).select("_id role settings.alerts");
  if (!user || user.role !== "lp") {
    res.status(404);
    throw new Error("LP user not found");
  }

  if (!user.settings.alerts) {
    res.status(400);
    throw new Error("This user has push notifications disabled");
  }

  const title = typeof req.body.title === "string" && req.body.title.trim()
    ? req.body.title.trim()
    : "L Max Update";
  const body = typeof req.body.body === "string" && req.body.body.trim()
    ? req.body.body.trim()
    : "You have a new notification.";
  const url = typeof req.body.url === "string" && req.body.url.trim()
    ? req.body.url.trim()
    : "/dashboard";

  const tokenDocs = await PushToken.find({ user: user._id }).select("token").lean();
  const tokens = tokenDocs.map((item) => item.token).filter(Boolean);

  if (tokens.length === 0) {
    res.status(400);
    throw new Error("No registered push tokens for this user");
  }

  const result = await sendPushNotificationToTokens(tokens, {
    notification: { title, body },
    data: {
      title,
      body,
      url,
      type: "admin_single",
    },
    webpush: {
      fcmOptions: { link: url },
    },
  });

  if (!result) {
    res.status(500);
    throw new Error("Firebase messaging service is not available");
  }

  const invalidTokens: string[] = [];
  result.responses.forEach((item, index) => {
    if (item.success) {
      return;
    }

    const code = item.error?.code || "";
    if (
      code.includes("registration-token-not-registered") ||
      code.includes("invalid-registration-token")
    ) {
      invalidTokens.push(tokens[index]);
    }
  });

  if (invalidTokens.length > 0) {
    await PushToken.deleteMany({ token: { $in: invalidTokens } });
  }

  return res.json({
    message: "Push sent to user",
    requested: tokens.length,
    successCount: result.successCount,
    failureCount: result.failureCount,
    removedInvalidTokens: invalidTokens.length,
  });
});

export const getWithdrawWalletMethods = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({
    role: "lp",
    "withdrawWallet.walletAddress": { $exists: true, $ne: "" },
  })
    .select("fullName email mainWalletBalance withdrawWallet createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    records: users.map((item) => ({
      id: String(item._id),
      fullName: item.fullName,
      email: item.email,
      mainWalletBalance: Number(item.mainWalletBalance || 0),
      walletAddress: item.withdrawWallet?.walletAddress || "",
      chainType: item.withdrawWallet?.chainType || "",
      currency: item.withdrawWallet?.currency || "",
      createdAt: item.createdAt,
    })),
  });
});

export const getAllWithdrawRequests = asyncHandler(async (_req: Request, res: Response) => {
  const records = await Withdraw.find()
    .populate("user", "fullName email mainWalletBalance")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    records: records.map((item) => ({
      id: String(item._id),
      txId: item.txId,
      amount: Number(item.amount || 0),
      walletAddress: item.walletAddress,
      chainType: item.chainType,
      currency: item.currency,
      status: item.status,
      adminRemark: item.adminRemark,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
      user: {
        id:
          item.user && typeof item.user === "object"
            ? String((item.user as Record<string, unknown>)._id ?? (item.user as Record<string, unknown>).id ?? "")
            : "",
        fullName:
          item.user && typeof item.user === "object" && "fullName" in item.user
            ? (item.user.fullName as string)
            : "",
        email:
          item.user && typeof item.user === "object" && "email" in item.user
            ? (item.user.email as string)
            : "",
        mainWalletBalance:
          item.user && typeof item.user === "object" && "mainWalletBalance" in item.user
            ? Number(item.user.mainWalletBalance as number)
            : 0,
      },
    })),
  });
});

export const reviewWithdrawRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const status = String(req.body.status || "").trim().toLowerCase();
  const adminRemark = String(req.body.adminRemark || "").trim();

  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Invalid withdrawal review status");
  }

  const withdraw = await Withdraw.findById(id);
  if (!withdraw) {
    res.status(404);
    throw new Error("Withdrawal request not found");
  }

  if (!["processing", "pending"].includes(withdraw.status)) {
    res.status(400);
    throw new Error("Withdrawal request already processed");
  }

  if (status === "approved") {
    withdraw.status = "approved";
  } else {
    withdraw.status = "cancelled";
    await User.findByIdAndUpdate(withdraw.user, {
      $inc: { mainWalletBalance: Number(withdraw.amount || 0) },
    });
  }

  withdraw.adminRemark = adminRemark;
  withdraw.reviewedAt = new Date();
  withdraw.reviewedBy = req.user._id as never;
  await withdraw.save();

  return res.json({
    message: withdraw.status === "approved" ? "Withdrawal approved" : "Withdrawal cancelled and amount restored",
    status: withdraw.status,
  });
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalUsers,
    mainBalResult,
    tradeBalResult,
    profitLossResult,
    depositResult,
    withdrawResult,
  ] = await Promise.all([
    User.countDocuments({ role: "lp" }),
    User.aggregate([{ $match: { role: "lp" } }, { $group: { _id: null, total: { $sum: "$mainWalletBalance" } } }]),
    TradeWallet.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
    TradeLog.aggregate([{ $group: { _id: "$tradeType", total: { $sum: "$profit" } } }]),
    Deposite.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Withdraw.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  const totalMainBalance = Number((mainBalResult[0]?.total || 0).toFixed(2));
  const totalTradeBalance = Number((tradeBalResult[0]?.total || 0).toFixed(2));
  const totalProfits = Number(
    (profitLossResult.find((r: { _id: string }) => r._id === "profit")?.total || 0).toFixed(2)
  );
  const totalLosses = Number(
    (profitLossResult.find((r: { _id: string }) => r._id === "loss")?.total || 0).toFixed(2)
  );
  const totalDeposits = Number((depositResult[0]?.total || 0).toFixed(2));
  const totalWithdrawals = Number((withdrawResult[0]?.total || 0).toFixed(2));

  return res.json({
    totalUsers,
    totalMainBalance,
    totalTradeBalance,
    totalProfits,
    totalLosses,
    totalDeposits,
    totalWithdrawals,
    netBalance: Number((totalDeposits - totalWithdrawals).toFixed(2)),
  });
});

export const getBrandingAssets = asyncHandler(async (_req: Request, res: Response) => {
  const branding = await Branding.findOne({ key: "default" }).lean();
  return res.json({ branding: toBrandingPayload(branding) });
});

export const uploadBrandingLogo = asyncHandler(async (req: Request, res: Response) => {
  const variant = String(req.params.variant || "").trim().toLowerCase() as BrandingLogoVariant;
  if (!Object.keys(BRANDING_DIMENSIONS).includes(variant)) {
    res.status(400);
    throw new Error("Invalid logo variant");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("PNG logo file is required");
  }

  const expected = BRANDING_DIMENSIONS[variant];
  const dimensions = readPngDimensions(req.file.path);
  if (dimensions.width !== expected.width || dimensions.height !== expected.height) {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error(`Invalid image size. ${variant} logo must be ${expected.width}x${expected.height}px`);
  }

  const publicPath = `/uploads/${req.file.filename}`;
  const branding = await Branding.findOne({ key: "default" });
  const nextBranding = branding || new Branding({ key: "default" });

  const fieldMap: Record<BrandingLogoVariant, "darkLogoPath" | "lightLogoPath" | "mobileLogoPath"> = {
    dark: "darkLogoPath",
    light: "lightLogoPath",
    mobile: "mobileLogoPath",
  };

  const fieldName = fieldMap[variant];
  const previousPath = nextBranding[fieldName];
  nextBranding[fieldName] = publicPath;
  await nextBranding.save();

  if (previousPath && previousPath !== publicPath) {
    const previousFilePath = path.join(process.cwd(), previousPath.replace(/^\//, ""));
    if (fs.existsSync(previousFilePath)) {
      fs.unlinkSync(previousFilePath);
    }
  }

  return res.json({
    message: `${variant} logo uploaded successfully`,
    branding: toBrandingPayload(nextBranding),
  });
});

export const getPaymentSetup = asyncHandler(async (_req: Request, res: Response) => {
  const paymentSetup = await PaymentSetup.findOne({ key: "default" }).lean();
  return res.json({ paymentSetup: toPaymentSetupPayload(paymentSetup) });
});

export const updatePaymentSetup = asyncHandler(async (req: Request, res: Response) => {
  const walletAddresses = req.body.walletAddresses as Partial<Record<"TRC20" | "ERC20" | "BEP20", string>>;

  let paymentSetup = await PaymentSetup.findOne({ key: "default" });
  if (!paymentSetup) {
    paymentSetup = new PaymentSetup(DEFAULT_PAYMENT_SETUP);
  }

  if (walletAddresses?.TRC20 !== undefined) {
    paymentSetup.networks.TRC20.walletAddress = String(walletAddresses.TRC20 || "").trim();
  }
  if (walletAddresses?.ERC20 !== undefined) {
    paymentSetup.networks.ERC20.walletAddress = String(walletAddresses.ERC20 || "").trim();
  }
  if (walletAddresses?.BEP20 !== undefined) {
    paymentSetup.networks.BEP20.walletAddress = String(walletAddresses.BEP20 || "").trim();
  }

  await paymentSetup.save();

  return res.json({ paymentSetup: toPaymentSetupPayload(paymentSetup) });
});

export const uploadPaymentQr = asyncHandler(async (req: Request, res: Response) => {
  const network = String(req.params.network || "").toUpperCase() as "TRC20" | "ERC20" | "BEP20";
  if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
    res.status(400);
    throw new Error("Invalid network");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("QR image upload is required");
  }

  let paymentSetup = await PaymentSetup.findOne({ key: "default" });
  if (!paymentSetup) {
    paymentSetup = new PaymentSetup(DEFAULT_PAYMENT_SETUP);
  }

  const previousPath = paymentSetup.networks[network]?.qrCodePath || "";
  if (previousPath && previousPath !== `/uploads/${req.file.filename}`) {
    deletePublicFile(previousPath);
  }

  paymentSetup.networks[network] = {
    ...paymentSetup.networks[network],
    qrCodePath: `/uploads/${req.file.filename}`,
  };

  await paymentSetup.save();

  return res.json({ paymentSetup: toPaymentSetupPayload(paymentSetup) });
});

export const deletePaymentQr = asyncHandler(async (req: Request, res: Response) => {
  const network = String(req.params.network || "").toUpperCase() as "TRC20" | "ERC20" | "BEP20";
  if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
    res.status(400);
    throw new Error("Invalid network");
  }

  const paymentSetup = await PaymentSetup.findOne({ key: "default" });
  if (!paymentSetup) {
    return res.json({ paymentSetup: toPaymentSetupPayload(null) });
  }

  const previousPath = paymentSetup.networks[network]?.qrCodePath || "";
  if (previousPath) {
    deletePublicFile(previousPath);
  }

  paymentSetup.networks[network] = {
    ...paymentSetup.networks[network],
    qrCodePath: "",
  };

  await paymentSetup.save();

  return res.json({ paymentSetup: toPaymentSetupPayload(paymentSetup) });
});

// ─── PnL Uploads ─────────────────────────────────────────────────────────────

import { PnlUpload } from "../models/PnlUpload";

export const uploadPnlFiles = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400);
    throw new Error("No PDF files provided");
  }

  const targetUserId = String(req.body.targetUserId || "").trim();
  if (!targetUserId) {
    res.status(400);
    throw new Error("Target LP/User is required");
  }

  const targetUser = await User.findById(targetUserId).select("_id fullName role").lean();
  if (!targetUser || targetUser.role !== "lp") {
    res.status(404);
    throw new Error("Target LP/User not found");
  }

  const records = await PnlUpload.insertMany(
    (req.files as Express.Multer.File[]).map((file) => ({
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      filePath: file.path,
      uploadedBy: req.user?._id,
      targetUser: targetUser._id,
    }))
  );

  return res.status(201).json({
    message: `${records.length} file(s) uploaded`,
    uploads: records.map((r) => ({
      id: String(r._id),
      fileName: r.fileName,
      originalName: r.originalName,
      fileSize: r.fileSize,
      targetUserId,
      targetUserName: targetUser.fullName,
      uploadedAt: r.createdAt,
    })),
  });
});

export const listPnlUploads = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.user?.role === "admin"
    ? {}
    : { targetUser: req.user?._id };

  const uploads = await PnlUpload.find(filter)
    .populate("targetUser", "fullName")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    uploads: uploads.map((r) => ({
      id: String(r._id),
      fileName: r.fileName,
      originalName: r.originalName,
      fileSize: r.fileSize,
      targetUserId: r.targetUser && typeof r.targetUser === "object" && "_id" in r.targetUser
        ? String(r.targetUser._id)
        : "",
      targetUserName: r.targetUser && typeof r.targetUser === "object" && "fullName" in r.targetUser
        ? String(r.targetUser.fullName || "")
        : "",
      uploadedAt: r.createdAt,
    })),
  });
});

export const deletePnlUpload = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const record = await PnlUpload.findById(id);
  if (!record) {
    res.status(404);
    throw new Error("PnL upload not found");
  }

  // Remove physical file if it exists
  try {
    const fs = await import("fs");
    if (fs.existsSync(record.filePath)) {
      fs.unlinkSync(record.filePath);
    }
  } catch {
    // Non-fatal: continue even if file removal fails
  }

  await record.deleteOne();

  return res.json({ message: "PnL upload deleted" });
});

export const downloadPnlUpload = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const record = await PnlUpload.findById(id).lean();
  if (!record) {
    res.status(404);
    throw new Error("PnL upload not found");
  }

  if (req.user?.role !== "admin" && String(record.targetUser || "") !== String(req.user?._id || "")) {
    res.status(403);
    throw new Error("You are not allowed to download this report");
  }

  const fs = await import("fs");
  if (!fs.existsSync(record.filePath)) {
    res.status(404);
    throw new Error("File not found on server");
  }

  res.download(record.filePath, record.originalName);
});

// ─── Page Content (CMS) ───────────────────────────────────────────────────────

const VALID_SLUGS: PageSlug[] = ["about", "help", "support", "faq"];

const DEFAULT_TITLES: Record<PageSlug, string> = {
  about: "About",
  help: "Help",
  support: "Support",
  faq: "FAQ",
};

export const getAdminPageContent = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as PageSlug;
  if (!VALID_SLUGS.includes(slug)) {
    res.status(400);
    throw new Error("Invalid page slug");
  }

  const page = await PageContent.findOne({ slug }).lean();
  return res.json({
    slug,
    title: page?.title ?? DEFAULT_TITLES[slug],
    content: page?.content ?? "",
  });
});

export const updateAdminPageContent = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as PageSlug;
  if (!VALID_SLUGS.includes(slug)) {
    res.status(400);
    throw new Error("Invalid page slug");
  }

  const title = String(req.body.title || DEFAULT_TITLES[slug]).trim();
  const content = String(req.body.content ?? "");

  const page = await PageContent.findOneAndUpdate(
    { slug },
    { slug, title, content, updatedBy: req.user?._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({
    message: "Page content updated",
    page: { slug: page.slug, title: page.title, content: page.content },
  });
});

export const getPublicPageContent = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug as PageSlug;
  if (!VALID_SLUGS.includes(slug)) {
    res.status(400);
    throw new Error("Invalid page slug");
  }

  const page = await PageContent.findOne({ slug }).lean();
  return res.json({
    slug,
    title: page?.title ?? DEFAULT_TITLES[slug],
    content: page?.content ?? "",
  });
});
