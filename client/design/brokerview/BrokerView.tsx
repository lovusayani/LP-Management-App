"use client";

import { useEffect, useState } from "react";
import { Boxes, CheckCircle2, CreditCard, Landmark, Layers, ListChecks, TrendingUp, Users, Wallet } from "lucide-react";

import { BrokerPageFrame } from "@/design/components/BrokerPageFrame";
import { GlossyCard } from "@/design/components/GlossyCard";
import { WalletOverviewCard } from "@/design/components/WalletOverviewCard";
import { getChargeSummary, getTrades, getWalletOverview, SuimfxTrade } from "@/services/trades.service";
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

const formatLots = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function BrokerView() {
    const [trades, setTrades] = useState<SuimfxTrade[]>([]);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [todaysCharge, setTodaysCharge] = useState<number>(0);
    const [monthCharge, setMonthCharge] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = () => {
            // Calling getTrades also drives the backend to fetch from the
            // external API and store any newly-seen orders' charges — so
            // this poll is what keeps the stored data current while this
            // dashboard stays open, not just a display refresh.
            Promise.allSettled([getTrades({ status: "all", limit: 500 }), getWalletBalances(), getChargeSummary()]).then(
                ([tradesResult, walletResult, chargeResult]) => {
                    if (cancelled) return;

                    if (tradesResult.status === "fulfilled") {
                        setTrades(tradesResult.value.data);
                    }
                    if (walletResult.status === "fulfilled") {
                        setWalletBalance(walletResult.value.tradeWalletBalance);
                    }
                    if (chargeResult.status === "fulfilled") {
                        setTodaysCharge(chargeResult.value.today);
                        setMonthCharge(chargeResult.value.month);
                    }
                    setLoading(false);
                }
            );

            // Persist today's wallet summary too; the visible numbers are
            // computed from the same client-side data as the rest of the
            // dashboard so they never disagree with what's already on screen.
            getWalletOverview().catch(() => undefined);
        };

        load();
        const intervalId = setInterval(load, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
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

    const todaysMargin = todaysTrades.reduce((sum, t) => sum + (t.used_margin || 0), 0);
    const todaysLotSize = todaysTrades.reduce((sum, t) => sum + (t.lot_size || 0), 0);

    const todaysProfit = todaysTrades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const todaysLoss = Math.abs(todaysTrades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const overviewOldBalance = walletBalance ?? 0;
    const overviewNewBalance = overviewOldBalance - todaysCharge + todaysProfit - todaysLoss;

    return (
        <BrokerPageFrame title="Dashboard">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] min-h-[120px] flex flex-col justify-center gap-3">
                <div className="flex items-start justify-between">
                    <span className="text-sm font-semibold text-zinc-300">Wallet Overview</span>
                    <Wallet className="h-4 w-4 text-zinc-300" strokeWidth={2} />
                </div>

                <WalletOverviewCard
                    oldBalance={overviewOldBalance}
                    charges={todaysCharge}
                    profit={todaysProfit}
                    loss={todaysLoss}
                    newBalance={overviewNewBalance}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <GlossyCard
                    accent="purple"
                    icon={Boxes}
                    title="Total Lot Size"
                    value={loading ? "..." : formatLots(todaysLotSize)}
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
                <GlossyCard
                    accent="blue"
                    icon={Landmark}
                    title="Total Margin"
                    value={loading ? "..." : formatCurrency(todaysMargin)}
                />
                <GlossyCard
                    accent="green"
                    icon={CreditCard}
                    title="Charge"
                    value={loading ? "..." : formatCurrency(todaysCharge)}
                    subtitle={loading ? undefined : formatCurrency(monthCharge)}
                />
            </div>
        </BrokerPageFrame>
    );
}
