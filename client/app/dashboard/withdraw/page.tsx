"use client";

import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";

import { useHydratedUser } from "@/hooks/useHydratedUser";
import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import {
    createWithdraw,
    getWithdrawHistory,
    getWithdrawWallet,
    saveWithdrawWallet,
} from "@/services/user.service";
import { WithdrawChain, WithdrawCurrency, WithdrawRecord, WithdrawWallet } from "@/types";
import { getProfile } from "@/services/user.service";

const CHAINS: WithdrawChain[] = ["TRC20", "ERC20", "BEP20"];
const CURRENCIES: { value: WithdrawCurrency; label: string; active: boolean }[] = [
    { value: "USDT", label: "USDT", active: true },
    { value: "USD", label: "USD (coming soon)", active: false },
    { value: "INR", label: "INR (coming soon)", active: false },
];

const normalizeChain = (value?: string): WithdrawChain => {
    const upper = String(value ?? "").trim().toUpperCase();
    return upper === "TRC20" || upper === "ERC20" || upper === "BEP20" ? (upper as WithdrawChain) : "TRC20";
};

const normalizeCurrency = (value?: string): WithdrawCurrency => {
    const upper = String(value ?? "").trim().toUpperCase();
    return upper === "USDT" || upper === "USD" || upper === "INR" ? (upper as WithdrawCurrency) : "USDT";
};

const STATUS_STYLES: Record<string, string> = {
    processing: "bg-amber-500/10 text-amber-300",
    pending: "bg-amber-500/10 text-amber-300",
    approved: "bg-green-500/10 text-green-300",
    cancelled: "bg-red-500/10 text-red-300",
    rejected: "bg-red-500/10 text-red-300",
};

export default function WithdrawPage() {
    const { user } = useHydratedUser();
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
    const [liveBalance, setLiveBalance] = useState<string | null>(null);

    const [withdrawWallet, setWithdrawWallet] = useState<WithdrawWallet | null>(null);
    const [walletLoading, setWalletLoading] = useState(true);

    const [walletForm, setWalletForm] = useState<WithdrawWallet>({
        walletAddress: "",
        chainType: "TRC20",
        currency: "USDT",
    });
    const [walletSaving, setWalletSaving] = useState(false);
    const [walletError, setWalletError] = useState("");
    const [walletSuccess, setWalletSuccess] = useState("");
    const [isEditingWallet, setIsEditingWallet] = useState(false);

    const [amount, setAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawError, setWithdrawError] = useState("");
    const [withdrawSuccess, setWithdrawSuccess] = useState("");

    const [history, setHistory] = useState<WithdrawRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const syncMainBalance = async () => {
        try {
            const profile = await getProfile();
            setLiveBalance(Number(profile.mainWalletBalance ?? 0).toFixed(2));
        } catch {
            // ignore sync errors; optimistic value remains visible
        }
    };

    const mainBalance = useMemo(
        () => liveBalance ?? Number(user?.mainWalletBalance ?? 0).toFixed(2),
        [user, liveBalance]
    );

    useLayoutEffect(() => {
        const updateWidth = () => {
            setDeviceWidth(window.innerWidth || document.documentElement.clientWidth || 360);
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [wallet, records] = await Promise.all([
                    getWithdrawWallet(),
                    getWithdrawHistory(),
                ]);
                // Fetch fresh balance from server
                syncMainBalance();
                setWithdrawWallet(wallet);
                if (wallet) {
                    setWalletForm({
                        walletAddress: String(wallet.walletAddress ?? "").trim(),
                        chainType: normalizeChain(wallet.chainType),
                        currency: normalizeCurrency(wallet.currency),
                    });
                }
                setHistory(records);
            } catch {
                // keep empty
            } finally {
                setWalletLoading(false);
                setHistoryLoading(false);
            }
        };
        load();
    }, []);

    const onSaveWallet = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setWalletSaving(true);
        setWalletError("");
        setWalletSuccess("");
        try {
            const payload: WithdrawWallet = {
                walletAddress: walletForm.walletAddress.trim(),
                chainType: normalizeChain(walletForm.chainType),
                currency: normalizeCurrency(walletForm.currency),
            };

            const saved = await saveWithdrawWallet(payload);
            setWithdrawWallet(saved);
            setWalletForm({
                walletAddress: String(saved.walletAddress ?? "").trim(),
                chainType: normalizeChain(saved.chainType),
                currency: normalizeCurrency(saved.currency),
            });
            setIsEditingWallet(false);
            setWalletSuccess("Withdrawal wallet saved successfully.");
        } catch (err) {
            setWalletError(err instanceof Error ? err.message : "Failed to save wallet");
        } finally {
            setWalletSaving(false);
        }
    };

    const onWithdraw = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setWithdrawing(true);
        setWithdrawError("");
        setWithdrawSuccess("");
        try {
            const requestedAmount = Number(amount);
            const record = await createWithdraw(requestedAmount);
            setHistory((prev) => [record, ...prev]);
            setLiveBalance((prev) => {
                const current = Number(prev ?? Number(user?.mainWalletBalance ?? 0));
                return Math.max(current - requestedAmount, 0).toFixed(2);
            });
            setAmount("");
            setWithdrawSuccess(`Request submitted — TX: ${record.txId}`);
            syncMainBalance();
        } catch (err) {
            setWithdrawError(err instanceof Error ? err.message : "Withdrawal failed");
        } finally {
            setWithdrawing(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#11286f_0%,_#02083f_32%,_#02062b_72%,_#01041f_100%)] pb-28">
            {/* ** Topbar ** */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                <div
                    className="pointer-events-auto mx-auto"
                    style={deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined}
                >
                    <DashboardTopbar title="Withdraw" showBack />
                </div>
            </div>

            <section className="space-y-4 px-3 pt-28 sm:px-4">
                {/* ** Main Wallet Balance Card ** */}
                <article className="relative overflow-hidden rounded-xl bg-[linear-gradient(120deg,#7b1fa2_0%,#38228f_48%,#2ea5d8_100%)] px-4 py-5 text-white">
                    <p className="text-xs uppercase tracking-widest text-white/60">Main Wallet Balance</p>
                    <p className="mt-1 text-3xl font-semibold">{mainBalance} <span className="text-base font-normal text-white/70">USDT</span></p>
                    <p className="mt-1 text-xs text-white/50">Available to Withdraw</p>
                </article>

                {/* ** Withdrawal Method Setup (shown when wallet not yet saved or editing) ** */}
                {!walletLoading && (
                    <div className="rounded-xl border border-white/10 bg-[#0f1638] p-4 text-white">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">Withdrawal Method</h2>
                        </div>

                        {withdrawWallet && !isEditingWallet && (
                            <div className="rounded-lg bg-white/5 px-3 py-3 text-sm">
                                <div className="mb-2 flex items-center justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
                                        onClick={() => {
                                            setWalletError("");
                                            setWalletSuccess("");
                                            setIsEditingWallet(true);
                                        }}
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                </div>
                                <p className="text-zinc-300">Address: <span className="font-mono text-white break-all">{withdrawWallet.walletAddress}</span></p>
                                <p className="text-zinc-300">Chain: <span className="text-white">{withdrawWallet.chainType}</span></p>
                                <p className="text-zinc-300">Currency: <span className="text-white">{withdrawWallet.currency}</span></p>
                            </div>
                        )}

                        {(!withdrawWallet || isEditingWallet) && (
                            <form className="space-y-3" onSubmit={onSaveWallet}>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400">Wallet Address</label>
                                    <input
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                                        placeholder="Enter your wallet address"
                                        value={walletForm.walletAddress}
                                        onChange={(e) => setWalletForm((p) => ({ ...p, walletAddress: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Chain Type</label>
                                        <select
                                            className="w-full rounded-lg border border-white/10 bg-[#0b1235] px-3 py-2 text-sm text-white outline-none"
                                            value={walletForm.chainType}
                                            onChange={(e) => setWalletForm((p) => ({ ...p, chainType: e.target.value as WithdrawChain }))}
                                        >
                                            {CHAINS.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400">Currency</label>
                                        <select
                                            className="w-full rounded-lg border border-white/10 bg-[#0b1235] px-3 py-2 text-sm text-white outline-none"
                                            value={walletForm.currency}
                                            onChange={(e) => setWalletForm((p) => ({ ...p, currency: e.target.value as WithdrawCurrency }))}
                                        >
                                            {CURRENCIES.map((c) => (
                                                <option key={c.value} value={c.value} disabled={!c.active}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {walletError && <p className="text-sm text-red-300">{walletError}</p>}
                                {walletSuccess && <p className="text-sm text-green-300">{walletSuccess}</p>}

                                <div className="flex gap-2">
                                    <button type="submit" className="btn-primary w-full" disabled={walletSaving}>
                                        {walletSaving ? "Saving..." : withdrawWallet ? "Update Wallet" : "Save Wallet"}
                                    </button>
                                    {withdrawWallet && (
                                        <button
                                            type="button"
                                            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200"
                                            onClick={() => {
                                                setWalletError("");
                                                setWalletSuccess("");
                                                setWalletForm({
                                                    walletAddress: String(withdrawWallet.walletAddress ?? "").trim(),
                                                    chainType: normalizeChain(withdrawWallet.chainType),
                                                    currency: normalizeCurrency(withdrawWallet.currency),
                                                });
                                                setIsEditingWallet(false);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ** Withdraw Request Form ** */}
                {/* No wallet saved — alert only, request form hidden */}
                {!walletLoading && !withdrawWallet && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
                        <p className="text-sm font-medium">⚠ Withdrawal Request Unavailable</p>
                        <p className="mt-1 text-xs text-amber-300">
                            Please complete your Withdrawal Method above and save it before submitting a withdrawal request.
                        </p>
                    </div>
                )}

                {/* Wallet saved — show request form */}
                {withdrawWallet && (
                    <div className="rounded-xl border border-white/10 bg-[#0f1638] p-4 text-white">
                        <h2 className="mb-3 font-semibold">Withdraw Request</h2>
                        <form className="space-y-3" onSubmit={onWithdraw}>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-400">Amount (USDT)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-zinc-500">Available: {mainBalance} USDT</p>
                            </div>

                            {withdrawError && <p className="text-sm text-red-300">{withdrawError}</p>}
                            {withdrawSuccess && <p className="text-sm text-green-300">{withdrawSuccess}</p>}

                            <button type="submit" className="btn-primary w-full" disabled={withdrawing}>
                                {withdrawing ? "Submitting..." : "Send Withdraw Request"}
                            </button>
                        </form>
                    </div>
                )}

                {/* ** Transaction History ** */}
                <div className="pb-4">
                    <h2 className="mb-3 text-base font-semibold uppercase tracking-wide text-white">Transaction History</h2>

                    {historyLoading && (
                        <p className="rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm text-zinc-400">Loading...</p>
                    )}

                    {!historyLoading && history.length === 0 && (
                        <p className="rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm text-zinc-400">No withdrawal requests yet.</p>
                    )}

                    {!historyLoading && history.map((item) => (
                        <article key={item.id} className="mb-2 rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-white">{Number(item.amount).toFixed(2)} {item.currency}</p>
                                    <p className="font-mono text-xs text-zinc-400">{item.txId}</p>
                                    <p className="text-xs text-zinc-500">{item.chainType} · {item.walletAddress.slice(0, 10)}...{item.walletAddress.slice(-6)}</p>
                                    {item.adminRemark && (
                                        <p className="text-xs text-zinc-400">Remark: {item.adminRemark}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[item.status] ?? "text-zinc-400"}`}>
                                        {item.status}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}

