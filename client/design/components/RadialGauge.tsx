interface RadialGaugeProps {
    value: string;
    unit: string;
    label: string;
    percent: number;
}

export function RadialGauge({ value, unit, label, percent }: RadialGaugeProps) {
    const angle = Math.min(100, Math.max(0, percent)) * 3.6;

    return (
        <div
            className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
            style={{
                background: `conic-gradient(#fb923c ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)`,
            }}
        >
            <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-[#0c1330] text-center">
                <div>
                    <p className="text-2xl font-bold text-white">
                        {value}
                        <span className="text-base align-top">{unit}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
                </div>
            </div>
        </div>
    );
}
