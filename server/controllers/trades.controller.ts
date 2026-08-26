import { Request, Response } from "express";

import { ApiSource } from "../models/ApiSource";
import { ExternalTrade, fetchTradesFromSource } from "../services/apiSource.service";
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

  const merged: (ExternalTrade & { source: string })[] = [];
  let total = 0;

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      merged.push(...result.value.data.map((trade) => ({ ...trade, source: sources[i].name })));
      total += result.value.total;
    } else {
      console.warn(`API source "${sources[i].name}" failed:`, result.reason);
    }
  });

  merged.sort((a, b) => new Date(b.open_datetime).getTime() - new Date(a.open_datetime).getTime());

  return res.json({
    success: true,
    data: merged,
    total,
    limit: limit || 100,
    offset: offset || 0,
  });
});
