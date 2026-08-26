import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type GlossyAccent = "blue" | "green" | "purple" | "violet" | "amber";

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
};

interface GlossyCardProps {
    accent: GlossyAccent;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    className?: string;
    children?: ReactNode;
}

export function GlossyCard({ accent, icon: Icon, title, subtitle, className = "", children }: GlossyCardProps) {
    const styles = ACCENT_STYLES[accent];

    return (
        <div
            className={`relative overflow-hidden rounded-3xl border ${styles.border} bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${className}`}
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.glow}`} />
            <div className="relative z-10">
                <div className={`inline-grid h-10 w-10 place-items-center rounded-2xl ${styles.iconBg} ${styles.iconColor}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
                {children}
            </div>
        </div>
    );
}
