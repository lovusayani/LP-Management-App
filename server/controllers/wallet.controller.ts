import { Request, Response } from "express";

import { TradeLog } from "../models/TradeLog";
import { TradeWallet } from "../models/TradeWallet";
import { WalletTransfer, WalletTransferDirection } from "../models/WalletTransfer";
import { asyncHandler } from "../utils/asyncHandler";

const ensureTradeWallet = async (userId: string) => {
  let tradeWallet = await TradeWallet.findOne({ user: userId });
  if (!tradeWallet) {
    tradeWallet = await TradeWallet.create({ user: userId, balance: 0 });
  }
  return tradeWallet;
};

const syncTradeWalletWithLatestTrade = async (userId: string, tradeWallet: { balance: number; save: () => Promise<unknown> }) => {
  const latestTrade = await TradeLog.findOne({ lpUser: userId })
    .sort({ createdAt: -1 })
    .select("currTradeBal")
    .lean();

  if (!latestTrade) {
    return tradeWallet;
  }

  const latestBalance = Number(latestTrade.currTradeBal || 0);
  if (!Number.isFinite(latestBalance)) {
    return tradeWallet;
  }

  if (Number(tradeWallet.balance || 0) !== latestBalance) {
    tradeWallet.balance = latestBalance;
    await tradeWallet.save();
  }

  return tradeWallet;
};

export const getWalletBalances = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const tradeWallet = await ensureTradeWallet(String(req.user._id));
  await syncTradeWalletWithLatestTrade(String(req.user._id), tradeWallet);

  return res.json({
    balances: {
      mainWalletBalance: req.user.mainWalletBalance ?? 0,
      tradeWalletBalance: tradeWallet.balance ?? 0,
      lockInBalance: req.user.lockInBalance ?? 0,
    },
  });
});

export const swapWalletBalance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const amount = Number(req.body.amount);
  const direction = String(req.body.direction || "") as WalletTransferDirection;

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400);
    throw new Error("Valid amount is required");
  }

  if (!["main_to_trade", "trade_to_main"].includes(direction)) {
    res.status(400);
    throw new Error("Invalid swap direction");
  }

  const tradeWallet = await ensureTradeWallet(String(req.user._id));
  await syncTradeWalletWithLatestTrade(String(req.user._id), tradeWallet);

  const currentMain = req.user.mainWalletBalance ?? 0;
  const currentTrade = tradeWallet.balance ?? 0;

  if (direction === "main_to_trade" && currentMain < amount) {
    res.status(400);
    throw new Error("Insufficient main wallet balance");
  }

  if (direction === "trade_to_main" && currentTrade < amount) {
    res.status(400);
    throw new Error("Insufficient trade wallet balance");
  }

  if (direction === "trade_to_main" && currentTrade - amount < (req.user.lockInBalance ?? 0)) {
    res.status(400);
    throw new Error("You must keep minimum lock in balance in trade wallet");
  }

  const nextMain = direction === "main_to_trade" ? currentMain - amount : currentMain + amount;
  const nextTrade = direction === "main_to_trade" ? currentTrade + amount : currentTrade - amount;

  req.user.mainWalletBalance = Number(nextMain.toFixed(2));
  await req.user.save();

  tradeWallet.balance = Number(nextTrade.toFixed(2));
  await tradeWallet.save();

  await WalletTransfer.create({
    user: req.user._id,
    amount: Number(amount.toFixed(2)),
    direction,
    mainBalanceAfter: req.user.mainWalletBalance,
    tradeBalanceAfter: tradeWallet.balance,
  });

  return res.json({
    message: "Wallet swap successful",
    balances: {
      mainWalletBalance: req.user.mainWalletBalance,
      tradeWalletBalance: tradeWallet.balance,
      lockInBalance: req.user.lockInBalance ?? 0,
    },
  });
});

export const getWalletSwapHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const records = await WalletTransfer.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return res.json({
    records: records.map((item) => ({
      id: String(item._id),
      amount: item.amount,
      direction: item.direction,
      mainBalanceAfter: item.mainBalanceAfter,
      tradeBalanceAfter: item.tradeBalanceAfter,
      createdAt: item.createdAt,
    })),
  });
});
