import { ApiSource } from "../models/ApiSource";
import { JobRun } from "../models/JobRun";
import { ExternalTrade, fetchTradesFromSource } from "./apiSource.service";
import { recordOrderCharges } from "./orderCharge.service";

const DAY_MS = 24 * 60 * 60 * 1000;

const acquireDailyLock = async (): Promise<boolean> => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await JobRun.create({ _id: `daily-charge-${today}`, runAt: new Date() });
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return false;
    }
    throw err;
  }
};

export const runDailyChargeJob = async (): Promise<void> => {
  const acquired = await acquireDailyLock();
  if (!acquired) {
    return;
  }

  console.log("Running daily charge job...");

  const sources = await ApiSource.find({ isActive: true }).lean();
  if (sources.length === 0) {
    console.log("Daily charge job: no active API sources.");
    return;
  }

  const results = await Promise.allSettled(
    sources.map((source) =>
      fetchTradesFromSource(
        { baseUrl: source.baseUrl, apiKey: source.apiKey, authHeader: source.authHeader },
        { status: "all", days: 90, limit: 500 }
      )
    )
  );

  const trades: (ExternalTrade & { source: string; ownerUserId?: string })[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const ownerUserId = sources[i].assignedUsers.length === 1 ? String(sources[i].assignedUsers[0]) : undefined;
      trades.push(...result.value.data.map((trade) => ({ ...trade, source: sources[i].name, ownerUserId })));
    } else {
      console.warn(`Daily charge job: source "${sources[i].name}" failed:`, result.reason);
    }
  });

  await recordOrderCharges(trades);
  console.log(`Daily charge job: processed ${trades.length} order(s) across ${sources.length} source(s).`);
};

export const scheduleDailyChargeJob = (): void => {
  runDailyChargeJob().catch((err) => console.warn("Daily charge job failed:", err));
  setInterval(() => {
    runDailyChargeJob().catch((err) => console.warn("Daily charge job failed:", err));
  }, DAY_MS);
};
