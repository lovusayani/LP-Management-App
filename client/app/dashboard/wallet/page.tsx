"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { Aldrich } from "next/font/google";

import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import {
    getProfile,
    getWalletBalances,
    getWalletSwapHistory,
    swapWalletBalance,
} from "@/services/user.service";
import { getSession } from "@/services/session.service";
import { WalletSwapDirection, WalletSwapHistoryRecord } from "@/types";

const aldrich = Aldrich({
    weight: "400",
    subsets: ["latin"],
});

export default function WalletPage() {
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
    const [mainWalletBalance, setMainWalletBalance] = useState<number>(
        getSession()?.user?.mainWalletBalance ?? 0
    );
    const [lockInBalance, setLockInBalance] = useState<number>(
        getSession()?.user?.lockInBalance ?? 500
    );
    const [tradeWalletBalance, setTradeWalletBalance] = useState<number>(0);
    const [openSwapModal, setOpenSwapModal] = useState(false);
    const [swapDirection, setSwapDirection] = useState<WalletSwapDirection>("main_to_trade");
    const [swapAmount, setSwapAmount] = useState("");
    const [swapLoading, setSwapLoading] = useState(false);
    const [swapError, setSwapError] = useState("");
    const [swapHistory, setSwapHistory] = useState<WalletSwapHistoryRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const formattedMainWallet = useMemo(
        () => Number(mainWalletBalance || 0).toFixed(2),
        [mainWalletBalance]
    );

    const formattedTradeWallet = useMemo(
        () => Number(tradeWalletBalance || 0).toFixed(2),
        [tradeWalletBalance]
    );

    const formattedLockInBalance = useMemo(
        () => Number(lockInBalance || 0).toFixed(2),
        [lockInBalance]
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
        const loadWalletState = async () => {
            try {
                const profile = await getProfile();
                setMainWalletBalance(profile.mainWalletBalance ?? 0);
                setLockInBalance(profile.lockInBalance ?? 500);
                const balances = await getWalletBalances();
                setMainWalletBalance(balances.mainWalletBalance ?? profile.mainWalletBalance ?? 0);
                setTradeWalletBalance(balances.tradeWalletBalance ?? 0);
                setLockInBalance(balances.lockInBalance ?? profile.lockInBalance ?? 500);
                const history = await getWalletSwapHistory();
                setSwapHistory(history);
            } catch {
                // Keep session/fallback balance on failure
            } finally {
                setHistoryLoading(false);
            }
        };

        loadWalletState();
    }, []);

    const onSwapSubmit = async () => {
        const amount = Number(swapAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            setSwapError("Please enter a valid amount");
            return;
        }

        setSwapLoading(true);
        setSwapError("");

        try {
            const balances = await swapWalletBalance(swapDirection, amount);
            setMainWalletBalance(balances.mainWalletBalance ?? 0);
            setTradeWalletBalance(balances.tradeWalletBalance ?? 0);
            setLockInBalance(balances.lockInBalance ?? lockInBalance);
            const history = await getWalletSwapHistory();
            setSwapHistory(history);
            setSwapAmount("");
            setOpenSwapModal(false);
        } catch (error) {
            setSwapError(error instanceof Error ? error.message : "Swap failed");
        } finally {
            setSwapLoading(false);
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
                    <DashboardTopbar title="Wallet" showBack />
                </div>
            </div>

            <section className="px-3 pt-28 sm:px-4">
                <h1 className={`${aldrich.className} text-center text-[26px] font-normal text-white`}>Trade Wallet Balance</h1>
            </section>

            <section className="mt-4 w-full px-3 sm:px-4">
                <div className="mx-auto w-full space-y-3">
                    {/* ** Wallet Cards + Swap ** */}
                    <div className="relative w-full space-y-3 pb-2">
                        <article className="relative flex min-h-[80px] w-full items-center overflow-hidden rounded-md bg-[linear-gradient(120deg,#7b1fa2_0%,#38228f_48%,#2ea5d8_100%)] px-4 py-6 text-white">
                            <div className="wallet-shimmer-overlay" aria-hidden="true" />
                            <div className="flex w-full items-center justify-between gap-3">
                                <p className="text-base leading-none sm:text-lg">Main Wallet</p>
                                <p className="text-xl leading-none sm:text-2xl">{formattedMainWallet}</p>
                            </div>
                        </article>

                        <article className="relative flex min-h-[80px] w-full items-center overflow-hidden rounded-md bg-[linear-gradient(120deg,#7b1fa2_0%,#38228f_48%,#2ea5d8_100%)] px-4 py-6 text-white">
                            <div className="wallet-shimmer-overlay" aria-hidden="true" />
                            <div className="flex w-full items-center justify-between gap-3">
                                <div>
                                    <p className="text-base leading-none sm:text-lg">Trade Wallet</p>
                                    <div className="mt-1 flex items-center gap-1 text-white/70">
                                        <Lock className="h-3 w-3" />
                                        <span className="text-xs font-bold">{formattedLockInBalance}$</span>
                                    </div>
                                </div>
                                <p className="text-xl leading-none sm:text-2xl">{formattedTradeWallet}</p>
                            </div>
                        </article>

                        <button
                            type="button"
                            onClick={() => {
                                setSwapError("");
                                setOpenSwapModal(true);
                            }}
                            className="absolute left-1/2 top-1/2 inline-grid h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-black bg-[#0f1574] text-base font-semibold leading-none tracking-wide text-white"
                        >
                            SWAP
                        </button>
                    </div>

                    {/* ** Deposit / Withdraw ** */}
                    <div className="grid w-full grid-cols-2 gap-3">
                        <Link
                            href="/dashboard/deposite"
                            className="h-[52px] w-full rounded-md border border-[#5d6ae5]/40 bg-[linear-gradient(130deg,#22185d_0%,#1a1853_62%,#121a49_100%)] text-base text-[#0010ff] sm:h-[56px] sm:text-lg"
                            style={{ clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)" }}
                        >
                            <span className="inline-flex h-full w-full items-center justify-center">Deposite</span>
                        </Link>

                        <Link
                            href="/dashboard/withdraw"
                            className="h-[52px] w-full rounded-md border border-[#5d6ae5]/40 bg-[linear-gradient(130deg,#122558_0%,#0f234f_60%,#0b1f44_100%)] text-base text-white sm:h-[56px] sm:text-lg"
                            style={{ clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)" }}
                        >
                            <span className="inline-flex h-full w-full items-center justify-center">Withdraw</span>
                        </Link>
                    </div>

                    {/* ** Transaction History ** */}
                    <div className="pt-16">
                        <h2 className="text-xl uppercase tracking-wide text-white">Transaction History</h2>

                        <div className="mt-3 space-y-2">
                            {historyLoading && (
                                <article className="rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm text-zinc-300">
                                    Loading swap history...
                                </article>
                            )}

                            {!historyLoading && swapHistory.length === 0 && (
                                <article className="rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm text-zinc-300">
                                    No swap history yet.
                                </article>
                            )}

                            {!historyLoading &&
                                swapHistory.map((item) => (
                                    <article
                                        key={item.id}
                                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f1638] px-3 py-2.5"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold">{Number(item.amount).toFixed(2)} USDT</p>
                                            <p className="text-xs text-zinc-400">
                                                {item.direction === "main_to_trade"
                                                    ? "Main to Trade"
                                                    : "Trade to Main"}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-zinc-300">
                                                {item.createdAt
                                                    ? new Date(item.createdAt).toLocaleDateString()
                                                    : "-"}
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                {item.createdAt
                                                    ? new Date(item.createdAt).toLocaleTimeString()
                                                    : "-"}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                        </div>
                    </div>
                </div>
            </section>

            {openSwapModal && (
                <div className="fixed inset-0 z-[230] grid place-items-center bg-black/70 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#0b1235] p-4 text-white">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Swap Wallet Balance</h3>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1 text-xs"
                                onClick={() => setOpenSwapModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-1 rounded-lg border border-white/10 bg-[#10183f] p-3 text-sm">
                            <p>Main Wallet: {formattedMainWallet}</p>
                            <p>Trade Wallet: {formattedTradeWallet}</p>
                            <p>Min Lock In (Trade): {formattedLockInBalance}</p>
                        </div>

                        <div className="mt-3 space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm text-zinc-200">Swap Direction</label>
                                <select
                                    className="w-full rounded-lg border border-white/20 bg-[#10183f] px-3 py-2 text-sm text-white outline-none"
                                    value={swapDirection}
                                    onChange={(event) => setSwapDirection(event.target.value as WalletSwapDirection)}
                                >
                                    <option value="main_to_trade">Main Wallet to Trade Wallet</option>
                                    <option value="trade_to_main">Trade Wallet to Main Wallet</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-200">Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={swapAmount}
                                    onChange={(event) => setSwapAmount(event.target.value)}
                                    className="w-full rounded-lg border border-white/20 bg-[#10183f] px-3 py-2 text-sm text-white outline-none"
                                    placeholder="Enter amount"
                                />
                            </div>

                            {swapError && <p className="text-sm text-rose-300">{swapError}</p>}

                            <button
                                type="button"
                                onClick={onSwapSubmit}
                                disabled={swapLoading}
                                className="btn-primary w-full"
                            >
                                {swapLoading ? "Swapping..." : "Confirm Swap"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
