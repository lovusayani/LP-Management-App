const currency = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface WalletOverviewCardProps {
    oldBalance: number;
    charges: number;
    profit: number;
    loss: number;
    newBalance: number;
    loading: boolean;
}

export function WalletOverviewCard({ oldBalance, charges, profit, loss, newBalance, loading }: WalletOverviewCardProps) {
    if (loading) {
        return <p className="text-sm text-zinc-500">Loading...</p>;
    }

    return (
        <div className="flex w-full items-start justify-between gap-4">
            <div className="space-y-1 text-sm text-zinc-200">
                <p>
                    <span className="text-zinc-400">Comm.</span> {currency.format(charges)}
                </p>
                <p>
                    <span className="text-zinc-400">Loss</span> {currency.format(loss)}
                </p>
                <p>
                    <span className="text-zinc-400">Profit</span> {currency.format(profit)}
                </p>
            </div>

            <div className="text-right">
                <p className="text-3xl font-bold text-white">{currency.format(newBalance)}</p>
                <p className="mt-1 text-xs text-zinc-500">Old: {currency.format(oldBalance)}</p>
            </div>
        </div>
    );
}
