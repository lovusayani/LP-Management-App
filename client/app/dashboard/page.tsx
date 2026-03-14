"use client";

import Link from "next/link";
import { ArrowLeftRight, BanknoteArrowUp, ChevronDown, HandCoins, PiggyBank } from "lucide-react";
import { ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { MarketCarousel } from "@/components/dashboard/MarketCarousel";
import { TradingViewChartCard } from "@/components/dashboard/TradingViewChartCard";
import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import { getWalletBalances } from "@/services/user.service";

const tickerItems = [
    { symbol: "BTC", price: "$62,410", change: "+2.8%" },
    { symbol: "ETH", price: "$3,285", change: "+1.5%" },
    { symbol: "SOL", price: "$142.30", change: "+4.2%" },
    { symbol: "TON", price: "$6.91", change: "-0.8%" },
    { symbol: "XRP", price: "$0.61", change: "+0.9%" },
    { symbol: "DOGE", price: "$0.14", change: "+3.1%" },
];

const topTapeItems = [
    { symbol: "US30", price: "37,769.49", change: "+0.27%" },
    { symbol: "NAS100", price: "16,943.93", change: "+0.46%" },
    { symbol: "OIL", price: "72.12", change: "-1.5%" },
    { symbol: "EUR/USD", price: "1.0853", change: "+0.35%" },
    { symbol: "GBP/USD", price: "1.2663", change: "-0.1%" },
    { symbol: "BTC/USD", price: "43,202.88", change: "+2.81%" },
    { symbol: "ETH/USD", price: "2,286.00", change: "+2.05%" },
    { symbol: "XAU/USD", price: "2,035.10", change: "+0.42%" },
];

function HeroActionButton({
    label,
    icon,
    positionClass,
    gradientId,
    href,
}: {
    label: string;
    icon: ReactNode;
    positionClass: string;
    gradientId: string;
    href?: string;
}) {
    const clipId = `${gradientId}-clip`;
    const content = (
        <>
            <div className="relative inline-grid h-16 w-16 place-items-center">
                <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0"
                    aria-hidden="true"
                >
                    <g clipPath={`url(#${clipId})`}>
                        <g transform="matrix(0 0.032 -0.032 0 32 32)">
                            <rect x="0" y="0" width="1031.25" height="1031.25" fill={`url(#${gradientId})`} shapeRendering="crispEdges" />
                            <rect x="0" y="0" width="1031.25" height="1031.25" transform="scale(1 -1)" fill={`url(#${gradientId})`} shapeRendering="crispEdges" />
                            <rect x="0" y="0" width="1031.25" height="1031.25" transform="scale(-1 1)" fill={`url(#${gradientId})`} shapeRendering="crispEdges" />
                            <rect x="0" y="0" width="1031.25" height="1031.25" transform="scale(-1)" fill={`url(#${gradientId})`} shapeRendering="crispEdges" />
                        </g>
                    </g>
                    <circle cx="32" cy="32" r="31.5" stroke="#030053" />
                    <defs>
                        <clipPath id={clipId}>
                            <circle cx="32" cy="32" r="31.5" />
                        </clipPath>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#2314FF" />
                            <stop offset="1" stopColor="#060021" />
                        </linearGradient>
                    </defs>
                </svg>
                <span className="relative z-10 text-white">{icon}</span>
            </div>
            <span className="mt-1.5 block text-[0.58rem] font-semibold text-white sm:text-[0.63rem]">{label}</span>
        </>
    );

    return (
        <div className={`absolute z-10 -translate-x-1/2 -translate-y-full text-center ${positionClass}`}>
            {href ? <Link href={href}>{content}</Link> : content}
        </div>
    );
}

export default function DashboardHomePage() {
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
    const [topbarHeight, setTopbarHeight] = useState(88);
    const [mainWalletBalance, setMainWalletBalance] = useState<number>(0);
    const [tradeWalletBalance, setTradeWalletBalance] = useState<number>(0);
    const [selectedWallet, setSelectedWallet] = useState<"main" | "trade">("main");
    const topbarRef = useRef<HTMLDivElement | null>(null);

    const formattedMainWalletBalance = useMemo(
        () => Number(mainWalletBalance || 0).toFixed(2),
        [mainWalletBalance]
    );

    const formattedTradeWalletBalance = useMemo(
        () => Number(tradeWalletBalance || 0).toFixed(2),
        [tradeWalletBalance]
    );

    const displayedWalletBalance = selectedWallet === "main"
        ? formattedMainWalletBalance
        : formattedTradeWalletBalance;

    useLayoutEffect(() => {
        const getCurrentDeviceWidth = () => {
            return window.innerWidth || document.documentElement.clientWidth || 360;
        };

        const updateWidth = () => {
            setDeviceWidth(getCurrentDeviceWidth());
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);

        return () => {
            window.removeEventListener("resize", updateWidth);
        };
    }, []);

    useLayoutEffect(() => {
        const measureTopbar = () => {
            if (topbarRef.current) {
                setTopbarHeight(topbarRef.current.offsetHeight);
            }
        };

        measureTopbar();

        let resizeObserver: ResizeObserver | null = null;
        if (topbarRef.current && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(measureTopbar);
            resizeObserver.observe(topbarRef.current);
        }

        window.addEventListener("resize", measureTopbar);

        return () => {
            window.removeEventListener("resize", measureTopbar);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        const loadMainBalance = async () => {
            try {
                const balances = await getWalletBalances();
                setMainWalletBalance(balances.mainWalletBalance ?? 0);
                setTradeWalletBalance(balances.tradeWalletBalance ?? 0);
            } catch {
                setMainWalletBalance(0);
                setTradeWalletBalance(0);
            }
        };

        loadMainBalance();
    }, []);

    const heroMaxWidth = deviceWidth ? `${deviceWidth}px` : "100%";
    const pageLayoutStyle = deviceWidth
        ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px`, margin: "0 auto" }
        : undefined;
    const currentWidth = deviceWidth ?? 360;
    const svgWidth = Math.round(Math.max(320, Math.min(currentWidth, 520)));
    const svgHeight = svgWidth;
    const svgTop = Math.round((-181 / 438) * svgWidth);

    if (deviceWidth === null) {
        return <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#11286f_0%,_#02083f_32%,_#02062b_72%,_#01041f_100%)]" />;
    }

    return (
        <div
            className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#11286f_0%,_#02083f_32%,_#02062b_72%,_#01041f_100%)] pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
            style={pageLayoutStyle}
        >
            {/* ** Hero Section ** */}
            <div className="relative">
                <section className="w-full px-0 pb-3 pt-0">
                    <div
                        className="relative w-full overflow-hidden"
                        style={{ height: "260px", maxWidth: heroMaxWidth }}
                    >
                        <svg
                            width={svgWidth}
                            height={svgHeight}
                            viewBox="0 0 438 402"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                            style={{ top: `${svgTop}px` }}
                        >
                            <ellipse cx="220" cy="201" rx="220" ry="201" fill="url(#paint0_radial_1_77)" />
                            <defs>
                                <radialGradient
                                    id="paint0_radial_1_77"
                                    cx="0"
                                    cy="0"
                                    r="1"
                                    gradientUnits="userSpaceOnUse"
                                    gradientTransform="translate(220 201) rotate(90) scale(201 220)"
                                >
                                    <stop stopColor="#0D1F56" />
                                    <stop offset="0.894231" stopColor="#0A132F" />
                                    <stop offset="1" stopColor="#00165B" />
                                </radialGradient>
                            </defs>
                        </svg>
                        <div
                            className="relative z-10 grid place-items-center px-3 text-center text-white"
                            style={{ marginTop: `${topbarHeight + 8}px` }}
                        >
                            <div className="relative inline-flex items-center">
                                <select
                                    value={selectedWallet}
                                    onChange={(event) => setSelectedWallet(event.target.value as "main" | "trade")}
                                    className="appearance-none rounded-full border border-zinc-200/80 bg-black/25 px-4 py-1 pr-8 text-[clamp(0.95rem,4.4vw,1.2rem)] font-bold leading-tight text-white outline-none"
                                >
                                    <option value="main">Main Wallet</option>
                                    <option value="trade">Trade Wallet</option>
                                </select>
                                <span className="pointer-events-none absolute right-2 inline-grid h-5 w-5 place-items-center">
                                    <ChevronDown className="h-4 w-4" />
                                </span>
                            </div>
                            <p className="mt-1 text-[clamp(1.7rem,6.4vw,2.4rem)] font-semibold tracking-tight">${displayedWalletBalance}</p>
                        </div>

                        <HeroActionButton
                            label="F2F"
                            icon={<HandCoins className="h-9 w-9" strokeWidth={2.2} />}
                            positionClass="left-[10%] top-[260px] sm:left-[11%]"
                            gradientId="paint0_diamond_send"
                            href="/dashboard/deposite"
                        />

                        <HeroActionButton
                            label="Withdraw"
                            icon={<BanknoteArrowUp className="h-9 w-9" strokeWidth={2.2} />}
                            positionClass="left-[90%] top-[260px] sm:left-[89%]"
                            gradientId="paint0_diamond_sell"
                            href="/dashboard/withdraw"
                        />

                    </div>
                </section>

                {/* ** Topbar ** */}
                <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                    <div
                        ref={topbarRef}
                        className="pointer-events-auto mx-auto"
                        style={deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined}
                    >
                        <DashboardTopbar />
                    </div>
                </div>
            </div>

            {/* ** Quick Actions ** */}
            <section className="-mt-6 w-full px-3 sm:px-4">
                <div className="w-full pt-0">
                    <div className="flex items-start justify-center gap-6">
                        <div className="text-center">
                            <Link
                                href="/dashboard/deposite"
                                className="inline-grid h-[52px] w-[52px] place-items-center rounded-full border border-[#030053] bg-[radial-gradient(50%_50%_at_50%_50%,_#2314FF_0%,_#060021_100%)] text-white"
                            >
                                <PiggyBank className="h-6 w-6" />
                            </Link>
                            <span className="mt-1 block text-xs font-semibold text-white">Deposit</span>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/dashboard/wallet"
                                className="inline-grid h-[52px] w-[52px] place-items-center rounded-full border border-[#030053] bg-[radial-gradient(50%_50%_at_50%_50%,_#2314FF_0%,_#060021_100%)] text-white"
                            >
                                <ArrowLeftRight className="h-6 w-6" />
                            </Link>
                            <span className="mt-1 block text-xs font-semibold text-white">Swap</span>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/dashboard/withdraw"
                                className="inline-grid h-[52px] w-[52px] place-items-center rounded-full border border-[#030053] bg-[radial-gradient(50%_50%_at_50%_50%,_#2314FF_0%,_#060021_100%)] text-white"
                            >
                                <BanknoteArrowUp className="h-6 w-6" />
                            </Link>
                            <span className="mt-1 block text-xs font-semibold text-white">Withdraw</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ** Top Market Tape ** */}
            <section className="mt-4 w-full px-0">
                <div className="overflow-hidden border-y border-white/10 bg-black/85 py-1.5">
                    <div
                        className="inline-flex min-w-max items-center gap-6 px-3 text-xs sm:gap-8 sm:px-4 sm:text-sm"
                        style={{ animation: "dashboardTapeMarquee 65s linear infinite" }}
                    >
                        {topTapeItems.concat(topTapeItems).map((item, index) => {
                            const positive = item.change.startsWith("+");

                            return (
                                <div key={`${item.symbol}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                                    <span className="font-semibold text-zinc-100">{item.symbol}</span>
                                    <span className="text-zinc-300">{item.price}</span>
                                    <span className={positive ? "text-emerald-400" : "text-rose-400"}>
                                        {positive ? "↗" : "↘"} {item.change}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ** Tickers / Scrollers ** */}
            <section className="mt-5 w-full px-3 sm:px-4">
                <div className="overflow-hidden pb-1">
                    <div
                        className="inline-flex min-w-max gap-2"
                        style={{ animation: "dashboardCardMarquee 75s linear infinite" }}
                    >
                        {tickerItems.concat(tickerItems).map((ticker, index) => {
                            const isPositive = ticker.change.startsWith("+");
                            return (
                                <article
                                    key={`${ticker.symbol}-${index}`}
                                    className="min-w-[136px] rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white"
                                >
                                    <p className="text-xs font-semibold tracking-wide text-zinc-100">{ticker.symbol}</p>
                                    <p className="mt-1 text-sm font-semibold">{ticker.price}</p>
                                    <p className={`mt-0.5 text-xs ${isPositive ? "text-emerald-300" : "text-rose-300"}`}>{ticker.change}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ** Live Chart ** */}
            <section className="mt-4 w-full px-3 sm:px-4">
                <TradingViewChartCard />
            </section>

            {/* ** Market Section ** */}
            <section className="mt-4 w-full px-3 sm:px-4">
                <MarketCarousel />
            </section>

            <style jsx>{`
                @keyframes dashboardTapeMarquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                @keyframes dashboardCardMarquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </div >
    );
}
