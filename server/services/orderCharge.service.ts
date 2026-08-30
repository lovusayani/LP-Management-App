import { ChargeSetting, GLOBAL_CHARGE_SYMBOL } from "../models/ChargeSetting";
import { OrderCharge } from "../models/OrderCharge";
import { ExternalTrade } from "./apiSource.service";

type ChargeableTrade = ExternalTrade & { source: string };

const buildRateLookup = async () => {
  const settings = await ChargeSetting.find().lean();
  const globalSetting = settings.find((s) => s.symbol === GLOBAL_CHARGE_SYMBOL);
  const symbolRates = new Map(
    settings.filter((s) => s.symbol !== GLOBAL_CHARGE_SYMBOL).map((s) => [s.symbol, s.chargePerStandardLot])
  );
  const globalRate = globalSetting?.chargePerStandardLot ?? 0;

  return (symbol: string) => symbolRates.get(symbol.toUpperCase()) ?? globalRate;
};

const toChargeDoc = (trade: ChargeableTrade, rate: number) => {
  const symbol = trade.symbol.toUpperCase();
  const lotSize = trade.lot_size as number;

  return {
    tradeId: trade.trade_id,
    source: trade.source,
    account: trade.username,
    symbol,
    position: trade.position,
    lotSize,
    chargePerStandardLot: rate,
    chargeAmount: lotSize * rate,
    orderDate: trade.open_datetime.slice(0, 10),
    openDatetime: new Date(trade.open_datetime),
  };
};

/**
 * Ongoing/daily charge recording. Only inserts orders that have never been
 * charged before (tradeId is unique) — an order's stored charge is locked in
 * at whatever rate applied when it was first seen, never recalculated later.
 */
export const recordOrderCharges = async (trades: ChargeableTrade[]): Promise<void> => {
  const chargeable = trades.filter((t) => typeof t.lot_size === "number" && t.lot_size > 0);
  if (chargeable.length === 0) {
    return;
  }

  const getRate = await buildRateLookup();

  await Promise.all(
    chargeable.map((trade) =>
      OrderCharge.updateOne(
        { tradeId: trade.trade_id },
        { $setOnInsert: toChargeDoc(trade, getRate(trade.symbol)) },
        { upsert: true }
      )
    )
  );
};

/**
 * One-time/manual backfill: (re)computes every matching order's charge using
 * the current rates, overwriting whatever was stored before. Use sparingly —
 * this rewrites history for orders that were already charged.
 */
export const backfillOrderCharges = async (trades: ChargeableTrade[]): Promise<number> => {
  const chargeable = trades.filter((t) => typeof t.lot_size === "number" && t.lot_size > 0);
  if (chargeable.length === 0) {
    return 0;
  }

  const getRate = await buildRateLookup();

  await Promise.all(
    chargeable.map((trade) =>
      OrderCharge.findOneAndUpdate(
        { tradeId: trade.trade_id },
        toChargeDoc(trade, getRate(trade.symbol)),
        { upsert: true }
      )
    )
  );

  return chargeable.length;
};
