"use client";

import { MoveUpRight } from "lucide-react";
import { TokenBTC, TokenETH, TokenTON } from "@web3icons/react";

type DemoMarketItem = {
    id: string;
    name: string;
    pair: string;
    price: number;
    changePercent: number;
    sparkline: number[];
};

const iconPool = [TokenBTC, TokenETH, TokenTON];

const demoMarketData: DemoMarketItem[] = [
    { id: "btc", name: "Bitcoin", pair: "BTC/USD", price: 69234.42, changePercent: 2.51, sparkline: [61, 58, 59, 57, 60, 62, 64, 63, 66, 68, 67, 70] },
    { id: "eth", name: "Ethereum", pair: "ETH/USD", price: 3812.77, changePercent: 1.92, sparkline: [48, 47, 49, 50, 51, 50, 52, 53, 55, 54, 56, 58] },
    { id: "ton", name: "Toncoin", pair: "TON/USD", price: 5.76, changePercent: -0.89, sparkline: [44, 46, 45, 43, 42, 41, 40, 41, 39, 38, 37, 36] },
    { id: "bnb", name: "BNB", pair: "BNB/USD", price: 612.17, changePercent: 0.44, sparkline: [35, 36, 35, 36, 37, 38, 37, 39, 38, 39, 40, 41] },
    { id: "sol", name: "Solana", pair: "SOL/USD", price: 178.34, changePercent: 4.08, sparkline: [39, 40, 42, 41, 43, 45, 47, 46, 48, 50, 52, 54] },
    { id: "xrp", name: "XRP", pair: "XRP/USD", price: 0.71, changePercent: -1.16, sparkline: [52, 51, 50, 49, 48, 47, 46, 47, 45, 44, 43, 42] },
    { id: "doge", name: "Dogecoin", pair: "DOGE/USD", price: 0.16, changePercent: 3.2, sparkline: [29, 30, 31, 30, 32, 33, 34, 35, 36, 37, 38, 40] },
    { id: "ada", name: "Cardano", pair: "ADA/USD", price: 0.79, changePercent: 0.75, sparkline: [33, 33, 34, 35, 34, 36, 37, 37, 38, 39, 40, 41] },
    { id: "link", name: "Chainlink", pair: "LINK/USD", price: 17.03, changePercent: -0.37, sparkline: [46, 45, 46, 45, 44, 43, 44, 43, 42, 41, 42, 41] },
    { id: "avax", name: "Avalanche", pair: "AVAX/USD", price: 45.11, changePercent: 1.26, sparkline: [31, 32, 33, 32, 34, 35, 34, 36, 37, 38, 39, 40] },
];

const toSparklinePoints = (prices: number[]): string => {
    if (prices.length < 2) {
        return "";
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    return prices
        .map((price, index) => {
            const x = (index / (prices.length - 1)) * 100;
            const y = 100 - ((price - min) / range) * 100;
            return `${x},${y}`;
        })
        .join(" ");
};

export const MarketCarousel = () => {
    return (
        <section className="mt-4">
            <div className="mb-2">
                <h2 className="text-[clamp(1.15rem,5.2vw,1.6rem)] font-semibold text-zinc-100">Market</h2>
            </div>

            <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                {demoMarketData.map((item, index) => {
                    const Icon = iconPool[index % iconPool.length];
                    const positive = item.changePercent >= 0;
                    const sparklinePoints = toSparklinePoints(item.sparkline);

                    return (
                        <article
                            key={item.id}
                            className="w-[9.2rem] shrink-0 snap-start rounded-lg border border-fuchsia-600/40 bg-gradient-to-b from-[#370739] via-[#29072f] to-[#1a0829] p-2.5 sm:w-[10.5rem]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon size={24} variant="background" />
                                    <div>
                                        <p className="text-[0.86rem] font-semibold leading-tight text-zinc-100">{item.name}</p>
                                        <p className="text-[0.72rem] leading-tight text-zinc-300">{item.pair}</p>
                                    </div>
                                </div>
                                <MoveUpRight className="h-4 w-4 text-zinc-100" />
                            </div>

                            <div className="mt-2 h-20 rounded-md border border-fuchsia-500/30 bg-gradient-to-b from-[#5c0a61] to-[#3e0a58] p-1.5">
                                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                                    <polyline
                                        fill="none"
                                        stroke={positive ? "#86efac" : "#fda4af"}
                                        strokeWidth="2"
                                        points={sparklinePoints}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-[0.7rem] text-zinc-100">
                                <span>
                                    ${item.price.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                                <span
                                    className={`rounded-full px-1.5 py-0.5 ${positive
                                        ? "bg-emerald-700/50 text-emerald-100"
                                        : "bg-rose-700/50 text-rose-100"
                                        }`}
                                >
                                    {positive ? "+" : ""}
                                    {item.changePercent.toFixed(2)}%
                                </span>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};
