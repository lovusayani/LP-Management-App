"use client";

import { useEffect, useState } from "react";

import { BrokerPageFrame } from "@/design/components/BrokerPageFrame";
import { TradeRow, TradeTable } from "@/design/components/TradeTable";
import { getTrades } from "@/services/trades.service";

export function ClosePosition() {
    const [rows, setRows] = useState<TradeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        getTrades({ status: "closed", limit: 500 })
            .then((res) => {
                if (cancelled) return;
                setRows(
                    res.data.map((t) => ({
                        tradeId: t.trade_id,
                        account: t.username,
                        symbol: t.symbol,
                        side: t.position,
                        lotSize: t.lot_size,
                        openAmount: t.open_amount,
                        closeAmount: t.close_amount,
                        usedMargin: t.used_margin,
                        pnl: t.pnl,
                        time: t.close_datetime || t.open_datetime,
                        source: t.source,
                    }))
                );
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Failed to load trades.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <BrokerPageFrame title="Close Position">
            {loading ? (
                <p className="text-sm text-zinc-400">Loading trades...</p>
            ) : error ? (
                <p className="text-sm text-rose-400">{error}</p>
            ) : (
                <TradeTable timeLabel="Close Time" rows={rows} />
            )}
        </BrokerPageFrame>
    );
}
