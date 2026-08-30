import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type GlossyAccent = "blue" | "green" | "purple" | "violet" | "amber" | "cyan";

const ACCENT_STYLES: Record<GlossyAccent, { border: string; glow: string; iconBg: string; iconColor: string }> = {
    blue: {
        border: "border-sky-400/30",
        glow: "from-sky-500/20 via-sky-500/5 to-transparent",
        iconBg: "bg-sky-500/20",
        iconColor: "text-sky-300",
    },
    green: {
        border: "border-emerald-400/30",
        glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        iconBg: "bg-emerald-500/20",
        iconColor: "text-emerald-300",
    },
    purple: {
        border: "border-fuchsia-400/30",
        glow: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
        iconBg: "bg-fuchsia-500/20",
        iconColor: "text-fuchsia-300",
    },
    violet: {
        border: "border-violet-400/30",
        glow: "from-violet-500/20 via-violet-500/5 to-transparent",
        iconBg: "bg-violet-500/20",
        iconColor: "text-violet-300",
    },
    amber: {
        border: "border-amber-400/30",
        glow: "from-amber-500/20 via-amber-500/5 to-transparent",
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-300",
    },
    cyan: {
        border: "border-cyan-400/30",
        glow: "from-cyan-500/20 via-cyan-500/5 to-transparent",
        iconBg: "bg-cyan-500/20",
        iconColor: "text-cyan-300",
    },
};

interface GlossyCardProps {
    accent: GlossyAccent;
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    value?: string;
    className?: string;
    children?: ReactNode;
}

export function GlossyCard({ accent, icon: Icon, title, subtitle, value, className = "", children }: GlossyCardProps) {
    const styles = ACCENT_STYLES[accent];
    const subtitleIsNegative = subtitle?.trim().startsWith("-");

    return (
        <div
            className={`relative overflow-hidden rounded-[8px] border ${styles.border} bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${className}`}
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow}`} />
            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-zinc-300">{title}</p>
                    {Icon && <Icon className={`h-4 w-4 ${styles.iconColor}`} strokeWidth={2} />}
                </div>
                {value && <p className="mt-4 break-words text-center text-2xl font-bold text-white">{value}</p>}
                {subtitle && (
                    <p
                        className={`mt-1 text-center text-xs font-bold ${
                            subtitleIsNegative ? "text-rose-400" : "text-zinc-400"
                        }`}
                    >
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
        </div>
    );
}
