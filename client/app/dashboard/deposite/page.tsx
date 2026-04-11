"use client";

import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Aldrich } from "next/font/google";
import { useRouter } from "next/navigation";

import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import { DepositeRecord, DepositeNetwork, PaymentSetupConfig } from "@/types";
import { getDepositeHistory, getPaymentSetupConfig, submitDeposite } from "@/services/user.service";
import { getPublicAssetUrl } from "@/services/api";

const aldrich = Aldrich({
    weight: "400",
    subsets: ["latin"],
});

const offerSlides = [
    { title: "Bonus Offer", subtitle: "Get +5% extra on first deposite", accent: "from-cyan-400 to-blue-500" },
    { title: "Fast Credit", subtitle: "Instant wallet credit in demo mode", accent: "from-fuchsia-400 to-violet-500" },
    { title: "Zero Fee", subtitle: "No processing fee for this week", accent: "from-emerald-400 to-teal-500" },
];

export default function DepositePage() {
    const router = useRouter();
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);
    const [amount, setAmount] = useState("10");
    const [depositeType, setDepositeType] = useState<"on_chain" | "f2f" | "buy_crypto">("on_chain");
    const [network, setNetwork] = useState("TRC20");
    const [screenshotName, setScreenshotName] = useState("");
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [depositeHistory, setDepositeHistory] = useState<DepositeRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [formError, setFormError] = useState("");
    const [paymentSetupConfig, setPaymentSetupConfig] = useState<PaymentSetupConfig | null>(null);

    const sliderTrackStyle = useMemo(
        () => ({ transform: `translateX(-${activeSlide * 100}%)` }),
        [activeSlide]
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
        const id = window.setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % offerSlides.length);
        }, 2800);

        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const records = await getDepositeHistory();
                setDepositeHistory(records);
            } catch (error) {
                setDepositeHistory([]);
                const message = error instanceof Error ? error.message : "Failed to load deposite history";
                if (message.toLowerCase().includes("unauthorized")) {
                    router.replace("/login");
                    return;
                }
                setFormError(message);
            } finally {
                setHistoryLoading(false);
            }
        };

        loadHistory();
    }, []);

    useEffect(() => {
        const loadPaymentSetup = async () => {
            try {
                const config = await getPaymentSetupConfig();
                setPaymentSetupConfig(config);
            } catch (error) {
                console.warn("Failed to load payment setup config", error);
            }
        };

        loadPaymentSetup();
    }, []);

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    const networkWalletAddress: Record<DepositeNetwork, string> = {
        TRC20: paymentSetupConfig?.networks?.TRC20?.walletAddress || "TRx9mDemoWalletAddress88621",
        ERC20: paymentSetupConfig?.networks?.ERC20?.walletAddress || "0xA91fDemoWalletAddress63D112Aa0",
        BEP20: paymentSetupConfig?.networks?.BEP20?.walletAddress || "0xBep20DemoWalletAddress9f11c6f",
    };

    const onAmountNext = () => {
        if (!amount.trim()) {
            return;
        }
        setFormStep(2);
    };

    const onTypeNext = () => {
        if (depositeType === "buy_crypto") {
            return;
        }

        if (depositeType === "on_chain") {
            setFormStep(3);
            return;
        }

        setFormStep(4);
    };

    const isNetworkConfigured = (selectedNetwork: DepositeNetwork) => {
        const networkConfig = paymentSetupConfig?.networks?.[selectedNetwork];
        return Boolean(networkConfig?.walletAddress?.trim() && networkConfig?.qrCodePath?.trim());
    };

    const onNetworkNext = () => {
        if (!network || !isNetworkConfigured(network as DepositeNetwork)) {
            return;
        }
        setFormStep(4);
    };

    const onFinalSubmit = async () => {
        if (!screenshotFile) {
            setFormError("Screenshot is required");
            return;
        }

        setFormError("");
        setSubmitting(true);

        try {
            const created = await submitDeposite({
                amount: Number(amount),
                depositeType,
                network: depositeType === "on_chain" ? (network as "TRC20" | "ERC20" | "BEP20") : undefined,
                remarks,
                screenshot: screenshotFile,
            });

            setDepositeHistory((prev) => [created, ...prev].slice(0, 10));
            setAmount("10000");
            setDepositeType("on_chain");
            setNetwork("TRC20");
            setScreenshotName("");
            setScreenshotFile(null);
            setRemarks("");
            setFormStep(1);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Deposite submit failed");
        } finally {
            setSubmitting(false);
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
                    <DashboardTopbar title="Deposite" showBack />
                </div>
            </div>

            <div className="mx-auto w-[calc(100%-24px)] max-w-2xl pb-6 pt-28 sm:w-[calc(100%-40px)]">
                {/* ** Offer Slider ** */}
                <section className="mx-auto w-full overflow-hidden rounded-2xl border border-white/20 bg-black/20">
                    <div className="flex transition-transform duration-500 ease-out" style={sliderTrackStyle}>
                        {offerSlides.map((slide) => (
                            <article key={slide.title} className="w-full shrink-0 p-4">
                                <div className={`rounded-xl bg-gradient-to-r ${slide.accent} p-4 text-white`}>
                                    <p className="text-sm uppercase tracking-wide opacity-90">Offer</p>
                                    <h2 className={`${aldrich.className} mt-1 text-2xl`}>{slide.title}</h2>
                                    <p className="mt-2 text-sm">{slide.subtitle}</p>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="mb-3 flex items-center justify-center gap-2">
                        {offerSlides.map((_, index) => (
                            <span
                                key={`dot-${index}`}
                                className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-6 bg-white" : "w-2 bg-white/40"}`}
                            />
                        ))}
                    </div>
                </section>

                {/* ** Deposite Form ** */}
                <section className="mx-auto mt-5 w-full rounded-2xl border border-white/20 bg-black/25 p-4 text-white">
                    <h3 className={`${aldrich.className} text-xl`}>Deposite Form</h3>

                    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                        <div className="rounded-lg border border-white/10 bg-[#0f1638] px-3 py-2 text-xs text-zinc-300">
                            Step {formStep} of 4
                        </div>

                        {formStep >= 1 && (
                            <div className="space-y-1.5">
                                <label className="text-sm text-zinc-200">Deposite Amount (USDT)</label>
                                <input
                                    className="w-full rounded-lg border border-white/20 bg-[#10183f] px-3 py-2 text-sm text-white outline-none"
                                    placeholder="10000"
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {formStep === 1 && (
                            <button
                                type="button"
                                onClick={onAmountNext}
                                className="mt-2 w-full rounded-lg bg-[linear-gradient(120deg,#1d4ed8_0%,#7c3aed_100%)] px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                Next
                            </button>
                        )}

                        {formStep >= 2 && (
                            <div className="space-y-2 rounded-xl border border-white/10 bg-[#0f1638] p-3">
                                <p className="text-sm font-semibold text-zinc-100">Select Deposite Type</p>

                                <button
                                    type="button"
                                    onClick={() => setDepositeType("on_chain")}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${depositeType === "on_chain" ? "border-cyan-300 bg-cyan-400/20 text-white" : "border-white/20 text-zinc-200"}`}
                                >
                                    On Chain Deposit (Active)
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDepositeType("f2f")}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${depositeType === "f2f" ? "border-cyan-300 bg-cyan-400/20 text-white" : "border-white/20 text-zinc-200"}`}
                                >
                                    F2F Deposite (Active)
                                </button>

                                <button
                                    type="button"
                                    disabled
                                    className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-zinc-500"
                                >
                                    Buy Crypto (Inactive)
                                </button>
                            </div>
                        )}

                        {formStep === 2 && (
                            <button
                                type="button"
                                onClick={onTypeNext}
                                className="mt-2 w-full rounded-lg bg-[linear-gradient(120deg,#1d4ed8_0%,#7c3aed_100%)] px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                Next
                            </button>
                        )}

                        {formStep >= 3 && depositeType === "on_chain" && (
                            <div className="space-y-1.5">
                                <label className="text-sm text-zinc-200">Deposite Network</label>
                                <select
                                    className="w-full rounded-lg border border-white/20 bg-[#10183f] px-3 py-2 text-sm text-white outline-none"
                                    value={network}
                                    onChange={(event) => setNetwork(event.target.value)}
                                >
                                    <option>TRC20</option>
                                    <option>ERC20</option>
                                    <option>BEP20</option>
                                </select>
                            </div>
                        )}

                        {formStep === 3 && depositeType === "on_chain" && (
                            <>
                                <button
                                    type="button"
                                    onClick={onNetworkNext}
                                    disabled={!isNetworkConfigured(network as DepositeNetwork)}
                                    className="mt-2 w-full rounded-lg bg-[linear-gradient(120deg,#1d4ed8_0%,#7c3aed_100%)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Next
                                </button>
                                {!isNetworkConfigured(network as DepositeNetwork) && (
                                    <p className="mt-2 text-sm text-amber-300">
                                        Please select a network with both wallet address and QR code configured.
                                    </p>
                                )}
                            </>
                        )}

                        {formStep >= 4 && (
                            <>
                                {depositeType === "on_chain" ? (
                                    <div className="space-y-2 rounded-xl border border-white/10 bg-[#0f1638] p-3">
                                        <p className="text-sm font-semibold text-zinc-100">Scan QR & Send Funds</p>
                                        {paymentSetupConfig?.networks?.[network as DepositeNetwork]?.qrCodePath ? (
                                            <img
                                                src={getPublicAssetUrl(paymentSetupConfig.networks[network as DepositeNetwork].qrCodePath)}
                                                alt={`${network} QR code`}
                                                className="mx-auto h-40 w-40 rounded-md border border-white/20 bg-[#0c112f] object-contain"
                                            />
                                        ) : (
                                            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-md border border-dashed border-white/20 bg-[#0c112f] text-sm text-zinc-500">
                                                No QR code configured yet
                                            </div>
                                        )}
                                        <p className="break-all rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-zinc-200">
                                            {networkWalletAddress[network as DepositeNetwork]}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-white/10 bg-[#0f1638] p-3 text-sm text-zinc-200">
                                        F2F Deposite selected. Share payment proof and remarks to complete demo submission.
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm text-zinc-200">Upload Screenshot</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full rounded-lg border border-white/20 bg-[#10183f] px-3 py-2 text-sm text-white outline-none"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            setScreenshotFile(file);
                                            setScreenshotName(file?.name || "");
                                        }}
                                        required
                                    />
                                    {screenshotName && <p className="text-xs text-zinc-300">Selected: {screenshotName}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm text-zinc-200">Remarks</label>
                                    <textarea
                                        className="min-h-[90px] w-full rounded-lg border border-white/20 bg-[#10183f] px-3 py-2 text-sm text-white outline-none"
                                        placeholder="Enter remarks"
                                        value={remarks}
                                        onChange={(event) => setRemarks(event.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={onFinalSubmit}
                                    disabled={submitting}
                                    className="mt-2 w-full rounded-lg bg-[linear-gradient(120deg,#1d4ed8_0%,#7c3aed_100%)] px-4 py-2.5 text-sm font-semibold text-white"
                                >
                                    {submitting ? "Submitting..." : "Submit Deposite"}
                                </button>

                                {formError && <p className="text-sm text-rose-300">{formError}</p>}
                            </>
                        )}
                    </form>
                </section>

                {/* ** Deposite History ** */}
                <section className="mx-auto mt-5 w-full rounded-2xl border border-white/20 bg-black/25 p-4 text-white">
                    <h3 className={`${aldrich.className} text-xl`}>Deposite History</h3>

                    <div className="mt-3 space-y-2">
                        {historyLoading && (
                            <article className="rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm text-zinc-300">
                                Loading deposite history...
                            </article>
                        )}

                        {!historyLoading && depositeHistory.length === 0 && (
                            <article className="rounded-xl border border-white/10 bg-[#0f1638] px-3 py-3 text-sm text-zinc-300">
                                No deposite history yet.
                            </article>
                        )}

                        {depositeHistory.map((item, index) => (
                            <article
                                key={`${item.id}-${index}`}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f1638] px-3 py-2.5"
                            >
                                <div>
                                    <p className="text-sm font-semibold">{Number(item.amount).toLocaleString()} USDT</p>
                                    <p className="text-xs text-zinc-400">{item.id}</p>
                                </div>

                                <div className="text-right">
                                    <p
                                        className={`text-xs font-semibold ${item.status === "approved"
                                            ? "text-emerald-300"
                                            : item.status === "rejected"
                                                ? "text-rose-300"
                                                : "text-amber-300"
                                            }`}
                                    >
                                        {item.status === "approved"
                                            ? "Success"
                                            : item.status === "rejected"
                                                ? "Rejected"
                                                : "Pending"}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {item.createdAt
                                            ? new Date(item.createdAt).toISOString().slice(0, 10)
                                            : "-"}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
