"use client";

export function TradingViewChartCard() {
    const chartUrl = "https://s.tradingview.com/widgetembed/?frameElementId=tradingview_xauusd_chart&symbol=OANDA%3AXAUUSD&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=rgba(5%2C11%2C29%2C1)&studies=%5B%22Volume%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=OANDA%3AXAUUSD";

    return (
        <div className="rounded-2xl border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(7,18,44,0.92),rgba(4,10,28,0.98))] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white sm:text-base">XAU/USD Live Market Chart</h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                    Live
                </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050B1D]">
                <iframe
                    title="XAU/USD TradingView Chart"
                    src={chartUrl}
                    className="block h-[480px] w-full border-0"
                    loading="lazy"
                />
            </div>
        </div>
    );
}