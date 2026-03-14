"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import { useHydratedUser } from "@/hooks/useHydratedUser";
import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import { UserTradeLogRecord, getMyTradeLogs } from "@/services/user.service";

export default function PerformancePage() {
    const pageSize = 10;
    const { user, loading } = useHydratedUser();
    const [rows, setRows] = useState<UserTradeLogRecord[]>([]);
    const [loadingRows, setLoadingRows] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);

    const canLoadTrades = useMemo(() => !loading && Boolean(user), [loading, user]);

    useLayoutEffect(() => {
        const updateWidth = () => {
            setDeviceWidth(window.innerWidth || document.documentElement.clientWidth || 360);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        if (!canLoadTrades) {
            return;
        }

        let disposed = false;

        const loadRows = async () => {
            setLoadingRows(true);
            try {
                const data = await getMyTradeLogs(currentPage, pageSize);
                if (!disposed) {
                    setRows(data.records);
                    setTotalPages(data.totalPages || 1);
                    setTotalRecords(data.total || 0);
                }
            } catch {
                if (!disposed) {
                    setRows([]);
                    setTotalPages(1);
                    setTotalRecords(0);
                }
            } finally {
                if (!disposed) {
                    setLoadingRows(false);
                }
            }
        };

        loadRows();

        return () => {
            disposed = true;
        };
    }, [canLoadTrades, currentPage]);

    return (
        <div className="min-h-screen w-full pb-28">
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                <div
                    className="pointer-events-auto mx-auto"
                    style={deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined}
                >
                    <DashboardTopbar title="Performance" showBack />
                </div>
            </div>

            <section className="px-3 pt-28 sm:px-4">
                <div
                    className="mx-auto w-full space-y-3"
                    style={
                        deviceWidth
                            ? { width: `${Math.min(deviceWidth - 24, 1040)}px`, maxWidth: "100%" }
                            : undefined
                    }
                >
                    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
                        <table className="min-w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900">
                                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Trade Pair</th>
                                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Date &amp; Time</th>
                                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Trade Value</th>
                                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Trade Type</th>
                                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Profit/Loss</th>
                                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Curr Trade Bal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRows ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-4 text-center text-zinc-400">Loading trades...</td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-4 text-center text-zinc-400">No trade logs found.</td>
                                    </tr>
                                ) : (
                                    rows.map((item) => {
                                        const isProfit = item.trade_type === "profit";
                                        return (
                                            <tr key={item.id} className="border-b border-zinc-800/70 last:border-b-0">
                                                <td className="px-3 py-2">
                                                    <p className="font-semibold text-zinc-100">{item.trade_pair}</p>
                                                    <p className="text-xs text-zinc-500">{item.trade_id}</p>
                                                </td>
                                                <td className="px-3 py-2 text-zinc-200">{item.trade_date} {item.trade_time}</td>
                                                <td className="px-3 py-2 text-zinc-100">{Number(item.trade_val || 0).toFixed(2)}$</td>
                                                <td className="px-3 py-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isProfit ? "border border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border border-rose-500/60 bg-rose-500/15 text-rose-300"}`}>
                                                        {isProfit ? "Profit" : "Loss"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isProfit ? "border border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border border-rose-500/60 bg-rose-500/15 text-rose-300"}`}>
                                                        {isProfit ? "+" : "-"}{Number(item.profit || 0).toFixed(2)}$
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-zinc-100">{Number(item.curr_trade_bal || 0).toFixed(2)}$</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-zinc-500">Total records: {totalRecords}</p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage <= 1}
                            >
                                Prev
                            </button>
                            <span className="text-xs text-zinc-300">Page {currentPage} / {totalPages}</span>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
