import { Request, Response } from "express";

import { PushToken } from "../models/PushToken";
import { TradeLog } from "../models/TradeLog";
import {
  isPushNotificationConfigured,
  sendPushNotificationToTokens,
} from "../services/push-notification.service";
import { storageService } from "../services/storage.service";
import { asyncHandler } from "../utils/asyncHandler";

const profilePayload = (user: NonNullable<Request["user"]>) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  mainWalletBalance: user.mainWalletBalance,
  lockInBalance: user.lockInBalance,
  status: user.status,
  mustChangePassword: user.mustChangePassword,
  onboardingCompleted: user.onboardingCompleted,
  kycSubmitted: user.kycSubmitted,
  kycStatus: user.kycStatus,
  kycDocuments: user.kycDocuments,
  settings: user.settings,
  createdAt: user.createdAt,
});

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  req.user.onboardingCompleted = true;
  await req.user.save();

  return res.json({ message: "Onboarding completed" });
});

export const submitKyc = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const requiredFields = ["companyProof", "panCard", "aadhaarCard", "selfie"];
  const missing = requiredFields.filter((field) => !files?.[field]?.[0]);
  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Missing required KYC files: ${missing.join(", ")}`);
  }

  req.user.kycDocuments = {
    companyProof: storageService.getRelativePath(files.companyProof[0].filename),
    panCard: storageService.getRelativePath(files.panCard[0].filename),
    aadhaarCard: storageService.getRelativePath(files.aadhaarCard[0].filename),
    selfie: storageService.getRelativePath(files.selfie[0].filename),
  };
  req.user.kycSubmitted = true;
  req.user.kycStatus = "pending";
  await req.user.save();

  return res.json({
    message: "KYC submitted successfully",
    kycStatus: req.user.kycStatus,
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  return res.json({ user: profilePayload(req.user) });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const nextFullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : req.user.fullName;
  const nextPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : req.user.phone;

  if (!nextFullName || nextFullName.length < 2) {
    res.status(400);
    throw new Error("Name must be at least 2 characters long");
  }

  req.user.fullName = nextFullName;
  req.user.phone = nextPhone || undefined;
  await req.user.save();

  return res.json({
    message: "Profile updated successfully",
    user: profilePayload(req.user),
  });
});

export const uploadProfileAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Avatar image is required");
  }

  if (!req.file.mimetype.startsWith("image/")) {
    res.status(400);
    throw new Error("Only image files are allowed for avatar upload");
  }

  req.user.avatar = storageService.getRelativePath(req.file.filename);
  await req.user.save();

  return res.json({
    message: "Profile photo updated successfully",
    user: profilePayload(req.user),
  });
});

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  return res.json({ settings: req.user.settings });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const { theme, fontSize, notificationSound, alerts } = req.body;

  req.user.settings.theme = theme ?? req.user.settings.theme;
  req.user.settings.fontSize = fontSize ?? req.user.settings.fontSize;
  req.user.settings.notificationSound =
    notificationSound ?? req.user.settings.notificationSound;
  req.user.settings.alerts = alerts ?? req.user.settings.alerts;
  await req.user.save();

  return res.json({ message: "Settings updated", settings: req.user.settings });
});

export const getPushNotificationStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const tokenCount = await PushToken.countDocuments({ user: req.user._id });

  return res.json({
    enabled: tokenCount > 0,
    tokenCount,
    serverConfigured: isPushNotificationConfigured(),
  });
});

export const registerPushToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
  if (!token) {
    res.status(400);
    throw new Error("Push token is required");
  }

  await PushToken.findOneAndUpdate(
    { token },
    {
      user: req.user._id,
      token,
      platform: "web",
      userAgent: req.get("user-agent") || "",
      lastSeenAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const tokenCount = await PushToken.countDocuments({ user: req.user._id });
  return res.json({
    message: "Push token registered",
    enabled: true,
    tokenCount,
    serverConfigured: isPushNotificationConfigured(),
  });
});

export const unregisterPushToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const token = typeof req.body.token === "string" ? req.body.token.trim() : "";

  if (token) {
    await PushToken.deleteMany({ user: req.user._id, token });
  } else {
    await PushToken.deleteMany({ user: req.user._id });
  }

  const tokenCount = await PushToken.countDocuments({ user: req.user._id });
  return res.json({
    message: "Push token removed",
    enabled: tokenCount > 0,
    tokenCount,
    serverConfigured: isPushNotificationConfigured(),
  });
});

export const sendMyTestPush = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  if (!isPushNotificationConfigured()) {
    res.status(400);
    throw new Error("Push notification server config is missing");
  }

  const tokenDocs = await PushToken.find({ user: req.user._id }).lean();
  const tokens = tokenDocs.map((item) => item.token).filter(Boolean);

  if (tokens.length === 0) {
    res.status(400);
    throw new Error("No registered push tokens for this user");
  }

  const title = typeof req.body.title === "string" && req.body.title.trim()
    ? req.body.title.trim()
    : "L Max Test Notification";
  const body = typeof req.body.body === "string" && req.body.body.trim()
    ? req.body.body.trim()
    : "Push notifications are configured correctly.";
  const url = typeof req.body.url === "string" && req.body.url.trim()
    ? req.body.url.trim()
    : "/dashboard";

  const result = await sendPushNotificationToTokens(tokens, {
    notification: { title, body },
    data: {
      title,
      body,
      url,
      type: "test",
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
    message: "Test push sent",
    requested: tokens.length,
    successCount: result.successCount,
    failureCount: result.failureCount,
    removedInvalidTokens: invalidTokens.length,
  });
});

export const transactionAccess = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const allowed = req.user.kycStatus === "approved";
  return res.json({
    allowed,
    message: allowed ? "Allowed" : "KYC approval required",
  });
});

export const getMyTradeLogs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    TradeLog.countDocuments({ lpUser: req.user._id }),
    TradeLog.find({ lpUser: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return res.json({
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    records: items.map((item) => ({
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
    })),
  });
});
