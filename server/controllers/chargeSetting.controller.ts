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
  const settings = await ChargeSetting.find().sort({ symbol: 1 }).lean();

  const global = settings.find((s) => s.symbol === GLOBAL_CHARGE_SYMBOL);
  const symbols = settings
    .filter((s) => s.symbol !== GLOBAL_CHARGE_SYMBOL)
    .map((s) => ({ symbol: s.symbol, chargePerStandardLot: s.chargePerStandardLot }));

  return res.json({
    global: global?.chargePerStandardLot ?? 0,
    symbols,
  });
});

export const setGlobalCharge = asyncHandler(async (req: Request, res: Response) => {
  const { chargePerStandardLot } = req.body as { chargePerStandardLot: number };

  await ChargeSetting.findOneAndUpdate(
    { symbol: GLOBAL_CHARGE_SYMBOL },
    { symbol: GLOBAL_CHARGE_SYMBOL, chargePerStandardLot },
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
    { symbol },
    { symbol, chargePerStandardLot },
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

  await ChargeSetting.deleteOne({ symbol });
  return res.json({ message: "Symbol charge removed" });
});

const PAGE_SIZE = 500;
const MAX_PAGES = 30; // safety cap: up to 15,000 rows per source

const fetchAllTradesForSource = async (source: {
  name: string;
  baseUrl: string;
  apiKey: string;
  authHeader: "x-api-key" | "bearer";
}): Promise<(ExternalTrade & { source: string })[]> => {
  const all: (ExternalTrade & { source: string })[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchTradesFromSource(
      { baseUrl: source.baseUrl, apiKey: source.apiKey, authHeader: source.authHeader },
      { status: "all", days: 90, limit: PAGE_SIZE, offset }
    );

    all.push(...response.data.map((trade) => ({ ...trade, source: source.name })));

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

  const trades: (ExternalTrade & { source: string })[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      trades.push(...result.value);
    }
  });

  const processed = await backfillOrderCharges(trades);

  return res.json({ processed, sources: sources.length });
});
