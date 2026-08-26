import { LucideIcon } from "lucide-react";

interface SliderRowProps {
    icon: LucideIcon;
    label: string;
    percent: number;
}

export function SliderRow({ icon: Icon, label, percent }: SliderRowProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4 text-zinc-400" strokeWidth={2} />
                    {label}
                </span>
                <span className="font-semibold text-white">{percent}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
            </div>
        </div>
    );
}
