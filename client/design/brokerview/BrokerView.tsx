"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Layers, ListChecks, TrendingUp, Users, Wallet } from "lucide-react";

import { BrokerPageFrame } from "@/design/components/BrokerPageFrame";
import { GlossyCard } from "@/design/components/GlossyCard";
import { getTrades, SuimfxTrade } from "@/services/trades.service";
import { getWalletBalances } from "@/services/user.service";

const isToday = (dateString: string | null) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
};

const isThisMonth = (dateString: string | null) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BrokerView() {
    const [trades, setTrades] = useState<SuimfxTrade[]>([]);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        Promise.allSettled([getTrades({ status: "all", limit: 500 }), getWalletBalances()]).then(
            ([tradesResult, walletResult]) => {
                if (cancelled) return;

                if (tradesResult.status === "fulfilled") {
                    setTrades(tradesResult.value.data);
                }
                if (walletResult.status === "fulfilled") {
                    setWalletBalance(walletResult.value.tradeWalletBalance);
                }
                setLoading(false);
            }
        );

        return () => {
            cancelled = true;
        };
    }, []);

    const todaysTrades = trades.filter((t) => isToday(t.open_datetime) || isToday(t.close_datetime));
    const todaysTradeBalance = todaysTrades.reduce((sum, t) => sum + (t.open_amount || 0), 0);
    const todaysPnl = todaysTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const todaysTraderCount = new Set(todaysTrades.map((t) => t.username)).size;

    const monthTrades = trades.filter((t) => isThisMonth(t.open_datetime) || isThisMonth(t.close_datetime));
    const monthTradeBalance = monthTrades.reduce((sum, t) => sum + (t.open_amount || 0), 0);
    const monthPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const openPositionsCount = trades.filter((t) => t.status === "Open").length;
    const closedTodayCount = trades.filter((t) => t.status === "Closed" && isToday(t.close_datetime)).length;

    return (
        <BrokerPageFrame title="Dashboard">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] min-h-[120px]" />

            <div className="grid grid-cols-2 gap-4">
                <GlossyCard
                    accent="purple"
                    icon={Wallet}
                    title="Wallet"
                    value={loading ? "..." : formatCurrency(walletBalance ?? 0)}
                />
                <GlossyCard
                    accent="violet"
                    icon={Users}
                    title="Traders Live"
                    value={loading ? "..." : String(todaysTraderCount)}
                />
                <GlossyCard
                    accent="blue"
                    icon={Layers}
                    title="Orders"
                    value={loading ? "..." : formatCurrency(todaysTradeBalance)}
                    subtitle={loading ? undefined : formatCurrency(monthTradeBalance)}
                />
                <GlossyCard
                    accent="green"
                    icon={TrendingUp}
                    title="P&L"
                    value={loading ? "..." : formatCurrency(todaysPnl)}
                    subtitle={loading ? undefined : formatCurrency(monthPnl)}
                />
                <GlossyCard
                    accent="amber"
                    icon={ListChecks}
                    title="Open Position"
                    value={loading ? "..." : String(openPositionsCount)}
                />
                <GlossyCard
                    accent="cyan"
                    icon={CheckCircle2}
                    title="Closed Orders"
                    value={loading ? "..." : String(closedTodayCount)}
                />
            </div>
        </BrokerPageFrame>
    );
}
