"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";

import { AdminDashboardStats, getAdminDashboardStats } from "@/services/admin.service";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

// ── TradingView Advanced Chart ────────────────────────────────────────────────
function TradingViewChart() {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = containerRef.current;
        if (!el || el.querySelector("script")) return;
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src =
            "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            autosize: true,
            symbol: "BINANCE:BTCUSDT",
            interval: "D",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: false,
            calendar: false,
            support_host: "https://www.tradingview.com",
        });
        el.appendChild(script);
    }, []);
    return (
        <div
            ref={containerRef}
            className="tradingview-widget-container"
            style={{ height: "100%", width: "100%" }}
        >
            <div
                className="tradingview-widget-container__widget"
                style={{ height: "calc(100% - 32px)", width: "100%" }}
            />
        </div>
    );
}

// ── Mini symbol overview ──────────────────────────────────────────────────────
const TICKERS = [
    { symbol: "BINANCE:BTCUSDT" },
    { symbol: "BINANCE:ETHUSDT" },
    { symbol: "TVC:GOLD" },
    { symbol: "FOREXCOM:SPXUSD" },
];

function MiniTicker({ symbol }: { symbol: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const mounted = useRef(false);
    useEffect(() => {
        if (!ref.current || mounted.current) return;
        mounted.current = true;
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src =
            "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol,
            width: "100%",
            height: "100%",
            locale: "en",
            dateRange: "1M",
            colorTheme: "dark",
            isTransparent: true,
            autosize: false,
        });
        ref.current.appendChild(script);
    }, [symbol]);
    return (
        <div
            className="tradingview-widget-container overflow-hidden rounded-xl border border-white/10"
            style={{ height: 164 }}
        >
            <div
                ref={ref}
                className="tradingview-widget-container__widget"
                style={{ height: 164, width: "100%" }}
            />
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
    title: string;
    main: string;
    sub?: string;
    subLabel?: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    badge?: { label: string; color: string };
}

function StatCard({ title, main, sub, subLabel, icon, gradient, iconBg, badge }: StatCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5 shadow-xl backdrop-blur-md`}
        >
            {/* glow blob */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-20 blur-2xl" />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium tracking-widest text-white/50 uppercase">{title}</p>
                    <p className="mt-1.5 truncate text-2xl font-bold text-white">{main}</p>
                    {sub && (
                        <p className="mt-1 text-xs text-white/60">
                            {subLabel && <span className="mr-1 text-white/40">{subLabel}</span>}
                            {sub}
                        </p>
                    )}
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-lg`}>
                    {icon}
                </div>
            </div>
            {badge && (
                <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                    </span>
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadStats = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAdminDashboardStats();
            setStats(data);
        } catch {
            setError("Failed to load dashboard stats.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const pnlNet = stats ? stats.totalProfits - stats.totalLosses : 0;

    const cards: StatCardProps[] = [
        {
            title: "Total LP Users",
            main: loading ? "—" : String(stats?.totalUsers ?? 0),
            sub: "Registered LP accounts",
            icon: <Users className="h-6 w-6 text-cyan-200" />,
            gradient: "from-cyan-900/60 via-cyan-800/30 to-sky-900/60",
            iconBg: "bg-cyan-500/30",
            badge: { label: "Live", color: "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" },
        },
        {
            title: "Total Balances",
            main: loading ? "—" : `$${fmt((stats?.totalMainBalance ?? 0) + (stats?.totalTradeBalance ?? 0))}`,
            sub: loading
                ? undefined
                : `Main $${fmt(stats?.totalMainBalance ?? 0)}  ·  Trade $${fmt(stats?.totalTradeBalance ?? 0)}`,
            icon: <Wallet className="h-6 w-6 text-violet-200" />,
            gradient: "from-violet-900/60 via-purple-800/30 to-indigo-900/60",
            iconBg: "bg-violet-500/30",
        },
        {
            title: "Profits & Losses",
            main: loading ? "—" : (pnlNet >= 0 ? `+$${fmt(pnlNet)}` : `-$${fmt(Math.abs(pnlNet))}`),
            sub: loading
                ? undefined
                : `P $${fmt(stats?.totalProfits ?? 0)}  ·  L $${fmt(stats?.totalLosses ?? 0)}`,
            icon:
                pnlNet >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-emerald-200" />
                ) : (
                    <TrendingDown className="h-6 w-6 text-rose-200" />
                ),
            gradient:
                pnlNet >= 0
                    ? "from-emerald-900/60 via-green-800/30 to-teal-900/60"
                    : "from-rose-900/60 via-red-800/30 to-pink-900/60",
            iconBg: pnlNet >= 0 ? "bg-emerald-500/30" : "bg-rose-500/30",
            badge: pnlNet >= 0
                ? { label: "Net Profit", color: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" }
                : { label: "Net Loss", color: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40" },
        },
        {
            title: "Net Flow",
            main: loading
                ? "—"
                : ((stats?.netBalance ?? 0) >= 0
                    ? `+$${fmt(stats?.netBalance ?? 0)}`
                    : `-$${fmt(Math.abs(stats?.netBalance ?? 0))}`),
            sub: loading
                ? undefined
                : `Dep $${fmt(stats?.totalDeposits ?? 0)}  ·  Wd $${fmt(stats?.totalWithdrawals ?? 0)}`,
            icon:
                (stats?.netBalance ?? 0) >= 0 ? (
                    <ArrowDownLeft className="h-6 w-6 text-amber-200" />
                ) : (
                    <ArrowUpRight className="h-6 w-6 text-orange-200" />
                ),
            gradient: "from-amber-900/60 via-orange-800/30 to-yellow-900/60",
            iconBg: "bg-amber-500/30",
            subLabel: "Deposits − Withdrawals",
        },
    ];

    return (
        <section className="space-y-6">
            {/* header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-zinc-400">Live LP management overview</p>
                </div>
                <button
                    type="button"
                    onClick={loadStats}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 backdrop-blur-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </p>
            )}

            {/* ── 4 stat cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>

            {/* ── TradingView widgets ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Chart */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-zinc-800/40 to-zinc-900/80 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        <p className="text-sm font-semibold text-white">Live Chart — BTC/USDT</p>
                        <span className="ml-auto text-xs text-zinc-500">TradingView</span>
                    </div>
                    <div style={{ height: 420 }}>
                        <TradingViewChart />
                    </div>
                </div>

                {/* Tickers 2×2 */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-zinc-800/40 to-zinc-900/80 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
                        <p className="text-sm font-semibold text-white">Market Tickers</p>
                        <span className="ml-auto text-xs text-zinc-500">TradingView</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-4">
                        {TICKERS.map((t) => (
                            <MiniTicker key={t.symbol} symbol={t.symbol} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

