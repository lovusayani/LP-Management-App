import { Request, Response } from "express";

import { ApiSource } from "../models/ApiSource";
import { OrderCharge } from "../models/OrderCharge";
import { TradeWallet } from "../models/TradeWallet";
import { WalletDailySummary } from "../models/WalletDailySummary";
import { ExternalTrade, fetchTradesFromSource } from "../services/apiSource.service";
import { recordOrderCharges } from "../services/orderCharge.service";
import { asyncHandler } from "../utils/asyncHandler";

export const getTrades = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const status = req.query.status as "open" | "closed" | "all" | undefined;
  const days = req.query.days ? Number(req.query.days) : undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;

  const sources = await ApiSource.find({ assignedUsers: req.user._id, isActive: true }).lean();

  if (sources.length === 0) {
    return res.json({ success: true, data: [], total: 0, limit: limit || 100, offset: offset || 0 });
  }

  const results = await Promise.allSettled(
    sources.map((source) =>
      fetchTradesFromSource(
        { baseUrl: source.baseUrl, apiKey: source.apiKey, authHeader: source.authHeader },
        { status, days, from, to, limit, offset }
      )
    )
  );

  const merged: (ExternalTrade & { source: string; ownerUserId?: string })[] = [];
  let total = 0;

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const ownerUserId = sources[i].assignedUsers.length === 1 ? String(sources[i].assignedUsers[0]) : undefined;
      merged.push(...result.value.data.map((trade) => ({ ...trade, source: sources[i].name, ownerUserId })));
      total += result.value.total;
    } else {
      console.warn(`API source "${sources[i].name}" failed:`, result.reason);
    }
  });

  merged.sort((a, b) => new Date(b.open_datetime).getTime() - new Date(a.open_datetime).getTime());

  try {
    await recordOrderCharges(merged);
  } catch (err) {
    console.warn("Failed to record order charges:", err);
  }

  return res.json({
    success: true,
    data: merged,
    total,
    limit: limit || 100,
    offset: offset || 0,
  });
});

export const getChargeSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const sources = await ApiSource.find({ assignedUsers: req.user._id, isActive: true }).select("name").lean();

  if (sources.length === 0) {
    return res.json({ today: 0, month: 0 });
  }

  const sourceNames = sources.map((s) => s.name);
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const [todayResult, monthResult] = await Promise.all([
    OrderCharge.aggregate([
      { $match: { source: { $in: sourceNames }, orderDate: today } },
      { $group: { _id: null, total: { $sum: "$chargeAmount" } } },
    ]),
    OrderCharge.aggregate([
      { $match: { source: { $in: sourceNames }, orderDate: { $regex: `^${monthPrefix}` } } },
      { $group: { _id: null, total: { $sum: "$chargeAmount" } } },
    ]),
  ]);

  return res.json({
    today: todayResult[0]?.total || 0,
    month: monthResult[0]?.total || 0,
  });
});

export const getWalletOverview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const today = new Date().toISOString().slice(0, 10);

  const tradeWallet = await TradeWallet.findOne({ user: req.user._id }).lean();
  const oldBalance = tradeWallet?.balance ?? 0;

  const sources = await ApiSource.find({ assignedUsers: req.user._id, isActive: true }).lean();
  const sourceNames = sources.map((s) => s.name);

  let charges = 0;
  let profit = 0;
  let loss = 0;

  if (sourceNames.length > 0) {
    const [chargeResult, tradeResults] = await Promise.all([
      OrderCharge.aggregate([
        { $match: { source: { $in: sourceNames }, orderDate: today } },
        { $group: { _id: null, total: { $sum: "$chargeAmount" } } },
      ]),
      Promise.allSettled(
        sources.map((source) =>
          fetchTradesFromSource({ baseUrl: source.baseUrl, apiKey: source.apiKey, authHeader: source.authHeader })
        )
      ),
    ]);

    charges = chargeResult[0]?.total || 0;

    const todaysTrades: ExternalTrade[] = [];
    tradeResults.forEach((result) => {
      if (result.status === "fulfilled") {
        todaysTrades.push(
          ...result.value.data.filter(
            (t) => t.open_datetime.slice(0, 10) === today || (t.close_datetime && t.close_datetime.slice(0, 10) === today)
          )
        );
      }
    });

    profit = todaysTrades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    loss = Math.abs(todaysTrades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  }

  const newBalance = oldBalance - charges + profit - loss;

  await WalletDailySummary.findOneAndUpdate(
    { user: req.user._id, date: today },
    { user: req.user._id, date: today, oldBalance, charges, profit, loss, newBalance },
    { upsert: true }
  );

  return res.json({ oldBalance, charges, profit, loss, newBalance });
});
