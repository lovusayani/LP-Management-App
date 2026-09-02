import { Request, Response } from "express";

import { ApiSource } from "../models/ApiSource";
import { ChargeSetting, GLOBAL_CHARGE_SYMBOL } from "../models/ChargeSetting";
import { OrderCharge } from "../models/OrderCharge";
import { ExternalTrade, fetchTradesFromSource } from "../services/apiSource.service";
import { backfillOrderCharges } from "../services/orderCharge.service";
import { asyncHandler } from "../utils/asyncHandler";

export const listOrderCharges = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 200);
  const skip = (page - 1) * limit;

  const [total, items, totalsAgg] = await Promise.all([
    OrderCharge.countDocuments(),
    OrderCharge.find().sort({ openDatetime: -1 }).skip(skip).limit(limit).lean(),
    OrderCharge.aggregate([{ $group: { _id: null, total: { $sum: "$chargeAmount" } } }]),
  ]);

  return res.json({
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    totalCharge: totalsAgg[0]?.total || 0,
    records: items.map((item) => ({
      id: String(item._id),
      tradeId: item.tradeId,
      source: item.source,
      account: item.account,
      symbol: item.symbol,
      position: item.position,
      lotSize: item.lotSize,
      chargePerStandardLot: item.chargePerStandardLot,
      chargeAmount: item.chargeAmount,
      orderDate: item.orderDate,
      openDatetime: item.openDatetime,
    })),
  });
});

export const listChargeSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await ChargeSetting.find()
    .populate("user", "fullName email")
    .sort({ symbol: 1 })
    .lean();

  const allUserRows = settings.filter((s) => !s.user);
  const global = allUserRows.find((s) => s.symbol === GLOBAL_CHARGE_SYMBOL);
  const symbols = allUserRows
    .filter((s) => s.symbol !== GLOBAL_CHARGE_SYMBOL)
    .map((s) => ({ symbol: s.symbol, chargePerStandardLot: s.chargePerStandardLot }));

  const userRows = settings.filter((s) => s.user) as Array<
    typeof settings[number] & { user: { _id: unknown; fullName: string; email: string } }
  >;

  const byUser = new Map<
    string,
    { userId: string; fullName: string; email: string; global: number | null; symbols: { symbol: string; chargePerStandardLot: number }[] }
  >();

  userRows.forEach((row) => {
    const userId = String(row.user._id);
    if (!byUser.has(userId)) {
      byUser.set(userId, {
        userId,
        fullName: row.user.fullName,
        email: row.user.email,
        global: null,
        symbols: [],
      });
    }
    const entry = byUser.get(userId)!;
    if (row.symbol === GLOBAL_CHARGE_SYMBOL) {
      entry.global = row.chargePerStandardLot;
    } else {
      entry.symbols.push({ symbol: row.symbol, chargePerStandardLot: row.chargePerStandardLot });
    }
  });

  return res.json({
    global: global?.chargePerStandardLot ?? 0,
    symbols,
    userOverrides: Array.from(byUser.values()),
  });
});

export const setGlobalCharge = asyncHandler(async (req: Request, res: Response) => {
  const { chargePerStandardLot } = req.body as { chargePerStandardLot: number };

  await ChargeSetting.findOneAndUpdate(
    { user: null, symbol: GLOBAL_CHARGE_SYMBOL },
    { user: null, symbol: GLOBAL_CHARGE_SYMBOL, chargePerStandardLot },
    { upsert: true }
  );

  return res.json({ global: chargePerStandardLot });
});

export const setSymbolCharge = asyncHandler(async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol).toUpperCase().trim();
  const { chargePerStandardLot } = req.body as { chargePerStandardLot: number };

  if (symbol === GLOBAL_CHARGE_SYMBOL) {
    res.status(400);
    throw new Error(`"${GLOBAL_CHARGE_SYMBOL}" is reserved; use the global charge endpoint instead.`);
  }

  await ChargeSetting.findOneAndUpdate(
    { user: null, symbol },
    { user: null, symbol, chargePerStandardLot },
    { upsert: true }
  );

  return res.json({ symbol, chargePerStandardLot });
});

export const deleteSymbolCharge = asyncHandler(async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol).toUpperCase().trim();

  if (symbol === GLOBAL_CHARGE_SYMBOL) {
    res.status(400);
    throw new Error("The global charge cannot be deleted.");
  }

  await ChargeSetting.deleteOne({ user: null, symbol });
  return res.json({ message: "Symbol charge removed" });
});

export const setUserGlobalCharge = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { chargePerStandardLot } = req.body as { chargePerStandardLot: number };

  await ChargeSetting.findOneAndUpdate(
    { user: userId, symbol: GLOBAL_CHARGE_SYMBOL },
    { user: userId, symbol: GLOBAL_CHARGE_SYMBOL, chargePerStandardLot },
    { upsert: true }
  );

  return res.json({ userId, chargePerStandardLot });
});

export const setUserSymbolCharge = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const symbol = String(req.params.symbol).toUpperCase().trim();
  const { chargePerStandardLot } = req.body as { chargePerStandardLot: number };

  if (symbol === GLOBAL_CHARGE_SYMBOL) {
    res.status(400);
    throw new Error(`"${GLOBAL_CHARGE_SYMBOL}" is reserved; use the user global charge endpoint instead.`);
  }

  await ChargeSetting.findOneAndUpdate(
    { user: userId, symbol },
    { user: userId, symbol, chargePerStandardLot },
    { upsert: true }
  );

  return res.json({ userId, symbol, chargePerStandardLot });
});

export const deleteUserGlobalCharge = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  await ChargeSetting.deleteOne({ user: userId, symbol: GLOBAL_CHARGE_SYMBOL });
  return res.json({ message: "User charge removed" });
});

export const deleteUserSymbolCharge = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const symbol = String(req.params.symbol).toUpperCase().trim();
  await ChargeSetting.deleteOne({ user: userId, symbol });
  return res.json({ message: "User charge removed" });
});

const PAGE_SIZE = 500;
const MAX_PAGES = 30; // safety cap: up to 15,000 rows per source

const fetchAllTradesForSource = async (source: {
  name: string;
  baseUrl: string;
  apiKey: string;
  authHeader: "x-api-key" | "bearer";
  assignedUsers: unknown[];
}): Promise<(ExternalTrade & { source: string; ownerUserId?: string })[]> => {
  const all: (ExternalTrade & { source: string; ownerUserId?: string })[] = [];
  const ownerUserId = source.assignedUsers.length === 1 ? String(source.assignedUsers[0]) : undefined;
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchTradesFromSource(
      { baseUrl: source.baseUrl, apiKey: source.apiKey, authHeader: source.authHeader },
      { status: "all", days: 90, limit: PAGE_SIZE, offset }
    );

    all.push(...response.data.map((trade) => ({ ...trade, source: source.name, ownerUserId })));

    offset += PAGE_SIZE;
    if (offset >= response.total || response.data.length === 0) {
      break;
    }
  }

  return all;
};

export const backfillCharges = asyncHandler(async (_req: Request, res: Response) => {
  const sources = await ApiSource.find({ isActive: true }).lean();

  if (sources.length === 0) {
    return res.json({ processed: 0, sources: 0 });
  }

  const results = await Promise.allSettled(sources.map((source) => fetchAllTradesForSource(source)));

  const trades: (ExternalTrade & { source: string; ownerUserId?: string })[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      trades.push(...result.value);
    }
  });

  const processed = await backfillOrderCharges(trades);

  return res.json({ processed, sources: sources.length });
});
