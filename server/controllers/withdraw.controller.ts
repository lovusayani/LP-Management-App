import { Request, Response } from "express";

import { Withdraw, WithdrawChain, WithdrawCurrency } from "../models/Withdraw";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

const ALLOWED_CHAINS: WithdrawChain[] = ["TRC20", "ERC20", "BEP20"];
const ACTIVE_CURRENCIES: WithdrawCurrency[] = ["USDT"];
const ALL_CURRENCIES: WithdrawCurrency[] = ["USDT", "USD", "INR"];

const genTxId = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const compact = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `WDL-${compact}-${rand}`;
};

export const getWithdrawWallet = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  return res.json({ withdrawWallet: req.user.withdrawWallet || null });
});

export const saveWithdrawWallet = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const walletAddress = typeof req.body.walletAddress === "string" ? req.body.walletAddress.trim() : "";
  const rawChain = typeof req.body.chainType === "string" ? req.body.chainType.trim() : "";
  const rawCurrency = typeof req.body.currency === "string" ? req.body.currency.trim() : "USDT";

  if (!walletAddress || walletAddress.length < 8) {
    res.status(400);
    throw new Error("A valid wallet address is required");
  }

  if (!ALLOWED_CHAINS.includes(rawChain as WithdrawChain)) {
    res.status(400);
    throw new Error("Invalid chain type. Supported: TRC20, ERC20, BEP20");
  }

  if (!ALL_CURRENCIES.includes(rawCurrency as WithdrawCurrency)) {
    res.status(400);
    throw new Error("Invalid currency");
  }

  if (!ACTIVE_CURRENCIES.includes(rawCurrency as WithdrawCurrency)) {
    res.status(400);
    throw new Error("Only USDT is currently active for withdrawals");
  }

  const chainType = rawChain as WithdrawChain;
  const currency = rawCurrency as WithdrawCurrency;

  req.user.withdrawWallet = { walletAddress, chainType, currency };
  await req.user.save();

  return res.json({
    message: "Withdrawal wallet saved",
    withdrawWallet: req.user.withdrawWallet,
  });
});

export const createWithdraw = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  if (!req.user.withdrawWallet?.walletAddress) {
    res.status(400);
    throw new Error("Please save your withdrawal wallet method first");
  }

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400);
    throw new Error("A valid withdrawal amount is required");
  }

  if (amount > req.user.mainWalletBalance) {
    res.status(400);
    throw new Error("Withdrawal amount exceeds available main wallet balance");
  }

  // Reserve funds immediately so admin can later approve or cancel safely.
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user._id, mainWalletBalance: { $gte: amount } },
    { $inc: { mainWalletBalance: -amount } },
    { new: true }
  ).select("mainWalletBalance");

  if (!updatedUser) {
    res.status(400);
    throw new Error("Insufficient main wallet balance");
  }

  const txId = genTxId();
  let withdraw;

  try {
    withdraw = await Withdraw.create({
      user: req.user._id,
      txId,
      amount,
      walletAddress: req.user.withdrawWallet.walletAddress,
      chainType: req.user.withdrawWallet.chainType,
      currency: req.user.withdrawWallet.currency,
      status: "processing",
    });
  } catch (error) {
    // Roll back reserved funds if request record fails.
    await User.findByIdAndUpdate(req.user._id, { $inc: { mainWalletBalance: amount } });
    throw error;
  }

  req.user.mainWalletBalance = Number(updatedUser.mainWalletBalance || 0);

  return res.status(201).json({
    message: "Withdrawal request submitted",
    withdraw: {
      id: withdraw._id,
      txId: withdraw.txId,
      amount: withdraw.amount,
      walletAddress: withdraw.walletAddress,
      chainType: withdraw.chainType,
      currency: withdraw.currency,
      status: withdraw.status,
      createdAt: withdraw.createdAt,
    },
  });
});

export const getWithdrawHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const records = await Withdraw.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    records: records.map((item) => ({
      id: item._id,
      txId: item.txId,
      amount: item.amount,
      walletAddress: item.walletAddress,
      chainType: item.chainType,
      currency: item.currency,
      status: item.status,
      adminRemark: item.adminRemark,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
    })),
  });
});
