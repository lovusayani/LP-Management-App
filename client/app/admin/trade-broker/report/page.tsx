"use client";

import { useEffect, useState } from "react";

import { getAdminOrderCharges, OrderChargeRecord } from "@/services/admin.service";

const currency = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (iso: string) => {
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

export default function AdminTradeBrokerReportPage() {
    const [records, setRecords] = useState<OrderChargeRecord[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalCharge, setTotalCharge] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const limit = 20;

    const load = async (targetPage: number) => {
        setLoading(true);
        setError("");
        try {
            const data = await getAdminOrderCharges(targetPage, limit);
            setRecords(data.records);
            setPage(data.page);
            setTotalPages(data.totalPages);
            setTotal(data.total);
            setTotalCharge(data.totalCharge);
        } catch {
            setError("Failed to load report.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Trade Broker · Report</h1>
                    <p className="mt-1 text-sm text-zinc-400">Every order charged so far, newest first.</p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                    <p>Total Orders: {total}</p>
                    <p>Total Charged: {currency.format(totalCharge)}</p>
                </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                            <th className="px-3 py-2 text-left">Order Date</th>
                            <th className="px-3 py-2 text-left">Account</th>
                            <th className="px-3 py-2 text-left">Symbol</th>
                            <th className="px-3 py-2 text-left">Side</th>
                            <th className="px-3 py-2 text-left">Lot Size</th>
                            <th className="px-3 py-2 text-left">Rate / Lot</th>
                            <th className="px-3 py-2 text-left">Charge</th>
                            <th className="px-3 py-2 text-left">Source</th>
                            <th className="px-3 py-2 text-left">Open Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="border-t border-zinc-800">
                                <td colSpan={9} className="px-3 py-4 text-zinc-400">Loading...</td>
                            </tr>
                        ) : records.length === 0 ? (
                            <tr className="border-t border-zinc-800">
                                <td colSpan={9} className="px-3 py-4 text-zinc-400">No charged orders yet.</td>
                            </tr>
                        ) : (
                            records.map((r) => (
                                <tr key={r.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2 text-zinc-300">{r.orderDate}</td>
                                    <td className="px-3 py-2 text-zinc-300">{r.account}</td>
                                    <td className="px-3 py-2 font-medium text-zinc-100">{r.symbol}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${r.position === "Buy" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                                                }`}
                                        >
                                            {r.position}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-300">{r.lotSize.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-zinc-300">{currency.format(r.chargePerStandardLot)}</td>
                                    <td className="px-3 py-2 font-semibold text-zinc-100">{currency.format(r.chargeAmount)}</td>
                                    <td className="px-3 py-2 text-zinc-400">{r.source}</td>
                                    <td className="px-3 py-2 text-zinc-400">{formatDateTime(r.openDatetime)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => load(page - 1)}
                        disabled={loading || page <= 1}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => load(page + 1)}
                        disabled={loading || page >= totalPages}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    );
}
