"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

import {
    backfillAdminCharges,
    ChargeSettings,
    deleteAdminSymbolCharge,
    getAdminChargeSettings,
    setAdminGlobalCharge,
    setAdminSymbolCharge,
} from "@/services/admin.service";

const LOT_CLASSES = [
    { size: "1.00", label: "Standard" },
    { size: "0.10", label: "Mini" },
    { size: "0.01", label: "Micro" },
    { size: "0.001", label: "Nano" },
];

export default function AdminTradeBrokerChargesPage() {
    const [settings, setSettings] = useState<ChargeSettings>({ global: 0, symbols: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [globalInput, setGlobalInput] = useState("0");
    const [savingGlobal, setSavingGlobal] = useState(false);

    const [newSymbol, setNewSymbol] = useState("");
    const [newRate, setNewRate] = useState("");
    const [addingSymbol, setAddingSymbol] = useState(false);
    const [busySymbol, setBusySymbol] = useState<string | null>(null);

    const [backfilling, setBackfilling] = useState(false);
    const [backfillMessage, setBackfillMessage] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAdminChargeSettings();
            setSettings(data);
            setGlobalInput(String(data.global));
        } catch {
            setError("Failed to load charge settings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onSaveGlobal = async () => {
        const value = Number(globalInput);
        if (!Number.isFinite(value) || value < 0) {
            setError("Enter a valid global charge amount.");
            return;
        }
        setSavingGlobal(true);
        setError("");
        try {
            await setAdminGlobalCharge(value);
            setSettings((prev) => ({ ...prev, global: value }));
        } catch {
            setError("Failed to save global charge.");
        } finally {
            setSavingGlobal(false);
        }
    };

    const onAddSymbol = async () => {
        const symbol = newSymbol.trim().toUpperCase();
        const rate = Number(newRate);
        setError("");
        if (!symbol) {
            setError("Enter a symbol, e.g. EURUSD.");
            return;
        }
        if (!Number.isFinite(rate) || rate < 0) {
            setError("Enter a valid charge amount.");
            return;
        }
        setAddingSymbol(true);
        try {
            await setAdminSymbolCharge(symbol, rate);
            setSettings((prev) => ({
                ...prev,
                symbols: [...prev.symbols.filter((s) => s.symbol !== symbol), { symbol, chargePerStandardLot: rate }].sort(
                    (a, b) => a.symbol.localeCompare(b.symbol)
                ),
            }));
            setNewSymbol("");
            setNewRate("");
        } catch {
            setError(`Failed to save charge for "${symbol}".`);
        } finally {
            setAddingSymbol(false);
        }
    };

    const onDeleteSymbol = async (symbol: string) => {
        setBusySymbol(symbol);
        setError("");
        try {
            await deleteAdminSymbolCharge(symbol);
            setSettings((prev) => ({ ...prev, symbols: prev.symbols.filter((s) => s.symbol !== symbol) }));
        } catch {
            setError(`Failed to remove charge for "${symbol}".`);
        } finally {
            setBusySymbol(null);
        }
    };

    const onBackfill = async () => {
        if (!window.confirm("Recompute charges for every existing order using the current rates? This overwrites previously stored charges.")) return;
        setBackfilling(true);
        setBackfillMessage("");
        setError("");
        try {
            const result = await backfillAdminCharges();
            setBackfillMessage(`Processed ${result.processed} order(s) across ${result.sources} source(s).`);
        } catch {
            setError("Backfill failed.");
        } finally {
            setBackfilling(false);
        }
    };

    return (
        <section className="card space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Trade Broker · Charges</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Set a charge per standard lot — globally, or overridden per symbol. Each order&apos;s charge is
                    computed as <span className="font-mono text-zinc-300">lot size × charge per standard lot</span>.
                </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="mb-2 text-xs font-medium text-zinc-400">Lot size reference</p>
                <div className="flex flex-wrap gap-2">
                    {LOT_CLASSES.map((lc) => (
                        <span key={lc.label} className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                            {lc.size} = {lc.label}
                        </span>
                    ))}
                </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {loading ? (
                <p className="text-sm text-zinc-400">Loading...</p>
            ) : (
                <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <p className="mb-2 text-sm font-semibold text-zinc-100">Global Default</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={globalInput}
                                onChange={(e) => setGlobalInput(e.target.value)}
                                className="w-40 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
                            />
                            <span className="text-xs text-zinc-500">per standard lot</span>
                            <button
                                type="button"
                                onClick={onSaveGlobal}
                                disabled={savingGlobal}
                                className="rounded-md border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingGlobal ? "Saving..." : "Save"}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Used for any symbol without its own override below.</p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
                        <p className="text-sm font-semibold text-zinc-100">Symbol Overrides</p>

                        {settings.symbols.length === 0 ? (
                            <p className="text-sm text-zinc-400">No symbol-specific charges yet — global default applies to all.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {settings.symbols.map((s) => (
                                    <div
                                        key={s.symbol}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2"
                                    >
                                        <span className="text-sm font-medium text-zinc-100">{s.symbol}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-zinc-300">{s.chargePerStandardLot.toFixed(2)} / lot</span>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSymbol(s.symbol)}
                                                disabled={busySymbol === s.symbol}
                                                className="inline-grid h-7 w-7 place-items-center rounded-md border border-red-800 text-red-400 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-40"
                                                title="Remove override"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
                            <input
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value)}
                                placeholder="Symbol, e.g. EURUSD"
                                className="w-40 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm uppercase text-zinc-100 outline-none focus:border-violet-500/60"
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                placeholder="Charge / lot"
                                className="w-32 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
                            />
                            <button
                                type="button"
                                onClick={onAddSymbol}
                                disabled={addingSymbol}
                                className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/40 bg-violet-600/20 px-3 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {addingSymbol ? "Adding..." : "Add Override"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                        <p className="text-sm font-semibold text-zinc-100">Recalculate Existing Orders</p>
                        <p className="mt-1 text-xs text-zinc-500">
                            Normally an order&apos;s charge is locked in once calculated. Use this to force every stored
                            order to be recomputed with the current rates above — useful right after changing a rate.
                        </p>
                        <button
                            type="button"
                            onClick={onBackfill}
                            disabled={backfilling}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-600/20 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${backfilling ? "animate-spin" : ""}`} />
                            {backfilling ? "Recalculating..." : "Run Backfill Now"}
                        </button>
                        {backfillMessage && <p className="mt-2 text-sm text-emerald-400">{backfillMessage}</p>}
                    </div>
                </>
            )}
        </section>
    );
}
