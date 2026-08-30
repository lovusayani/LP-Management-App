"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Search } from "lucide-react";

export interface TradeRow {
    tradeId: string;
    account: string;
    symbol: string;
    side: "Buy" | "Sell";
    lotSize?: number;
    openAmount: number;
    closeAmount: number | null;
    usedMargin?: number;
    pnl: number;
    time: string;
    source: string;
}

interface TradeTableProps {
    timeLabel: string;
    rows: TradeRow[];
}

type SortKey =
    | "account"
    | "symbol"
    | "side"
    | "lotSize"
    | "openAmount"
    | "closeAmount"
    | "usedMargin"
    | "pnl"
    | "time"
    | "source";
type SortDir = "asc" | "desc";
type SideFilter = "all" | "Buy" | "Sell";

const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatAmount = (value: number | null | undefined) => (value === null || value === undefined ? "—" : currency.format(value));

const lotFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatLots = (value: number | undefined) => (value === undefined ? "—" : lotFormat.format(value));

const formatPnl = (value: number) => `${value >= 0 ? "+" : ""}${currency.format(value)}`;

const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const COLUMNS: { key: SortKey; label: string }[] = [
    { key: "account", label: "Account" },
    { key: "symbol", label: "Symbol" },
    { key: "side", label: "Side" },
    { key: "lotSize", label: "Lots" },
    { key: "openAmount", label: "Open" },
    { key: "closeAmount", label: "Close" },
    { key: "usedMargin", label: "Margin" },
    { key: "pnl", label: "P/L" },
    { key: "time", label: "__TIME__" },
    { key: "source", label: "Source" },
];

export function TradeTable({ timeLabel, rows }: TradeTableProps) {
    const [search, setSearch] = useState("");
    const [sideFilter, setSideFilter] = useState<SideFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("time");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter((row) => {
            if (sideFilter !== "all" && row.side !== sideFilter) return false;
            if (!term) return true;
            return (
                row.account.toLowerCase().includes(term) ||
                row.symbol.toLowerCase().includes(term) ||
                row.source.toLowerCase().includes(term)
            );
        });
    }, [rows, search, sideFilter]);

    const sorted = useMemo(() => {
        const copy = [...filtered];
        copy.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case "lotSize":
                    cmp = (a.lotSize ?? -Infinity) - (b.lotSize ?? -Infinity);
                    break;
                case "openAmount":
                    cmp = a.openAmount - b.openAmount;
                    break;
                case "closeAmount":
                    cmp = (a.closeAmount ?? -Infinity) - (b.closeAmount ?? -Infinity);
                    break;
                case "usedMargin":
                    cmp = (a.usedMargin ?? -Infinity) - (b.usedMargin ?? -Infinity);
                    break;
                case "pnl":
                    cmp = a.pnl - b.pnl;
                    break;
                case "time":
                    cmp = new Date(a.time).getTime() - new Date(b.time).getTime();
                    break;
                default:
                    cmp = a[sortKey].localeCompare(b[sortKey]);
            }
            return sortDir === "asc" ? cmp : -cmp;
        });
        return copy;
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const onSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "time" ? "desc" : "asc");
        }
        setPage(1);
    };

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortKey !== colKey) return <ChevronsUpDown className="h-3 w-3 text-zinc-600" />;
        return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-sky-300" /> : <ChevronDown className="h-3 w-3 text-sky-300" />;
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-[220px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search account, symbol or source"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-sky-400/50"
                    />
                </div>

                <div className="flex gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    {(["all", "Buy", "Sell"] as SideFilter[]).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                setSideFilter(option);
                                setPage(1);
                            }}
                            className={`rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${sideFilter === option
                                    ? "bg-sky-500/20 text-sky-300"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            {option === "all" ? "All" : option}
                        </button>
                    ))}
                </div>
            </div>

            {sorted.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
                    <p className="text-sm text-zinc-400">No trades match your search.</p>
                </div>
            ) : (
                <>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 text-zinc-500">
                                        {COLUMNS.map((col) => (
                                            <th key={col.key} className="px-4 py-3 font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => onSort(col.key)}
                                                    className="inline-flex items-center gap-1 hover:text-zinc-300"
                                                >
                                                    {col.key === "time" ? timeLabel : col.label}
                                                    <SortIcon colKey={col.key} />
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((row) => {
                                        const isProfit = row.pnl >= 0;
                                        return (
                                            <tr key={row.tradeId} className="border-b border-white/5 last:border-b-0">
                                                <td className="px-4 py-3 text-zinc-300">{row.account}</td>
                                                <td className="px-4 py-3 font-semibold text-white">{row.symbol}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${row.side === "Buy"
                                                                ? "bg-emerald-500/15 text-emerald-300"
                                                                : "bg-rose-500/15 text-rose-300"
                                                            }`}
                                                    >
                                                        {row.side}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-zinc-300">{formatLots(row.lotSize)}</td>
                                                <td className="px-4 py-3 text-zinc-300">{formatAmount(row.openAmount)}</td>
                                                <td className="px-4 py-3 text-zinc-300">{formatAmount(row.closeAmount)}</td>
                                                <td className="px-4 py-3 text-zinc-300">{formatAmount(row.usedMargin)}</td>
                                                <td className={`px-4 py-3 font-semibold ${isProfit ? "text-emerald-300" : "text-rose-300"}`}>
                                                    {formatPnl(row.pnl)}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-400">{formatTime(row.time)}</td>
                                                <td className="px-4 py-3 text-zinc-400">{row.source}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>
                            Page {currentPage} of {totalPages} · {sorted.length} trade{sorted.length === 1 ? "" : "s"}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="inline-grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03] disabled:opacity-30"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.03] disabled:opacity-30"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
