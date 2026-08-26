"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, LayoutDashboard, LifeBuoy, Wallet } from "lucide-react";
import { LucideIcon } from "lucide-react";

const items = [
    { href: "/dashboard/brokerview/open", label: "Open Position", icon: ArrowUpRight },
    { href: "/dashboard/brokerview/close", label: "Close Position", icon: ArrowDownRight },
    { href: "/dashboard/brokerview", label: "Overview", icon: LayoutDashboard, isCenter: true },
    { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
    { href: "/dashboard/brokerview/support", label: "Support", icon: LifeBuoy },
];

export function BrokerBottomBar({ deviceWidth }: { deviceWidth: number | null }) {
    const pathname = usePathname();
    const barWidth = deviceWidth ? `${deviceWidth}px` : "100vw";

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]"
            style={{ width: barWidth, minWidth: barWidth, maxWidth: barWidth, margin: "0 auto" }}
        >
            <div className="relative flex w-[92%] items-center justify-between rounded-full border border-white/10 bg-[#0b1130]/80 px-5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                {items.slice(0, 2).map((item) => (
                    <BarButton key={item.href} {...item} active={pathname === item.href} />
                ))}

                {(() => {
                    const center = items[2];
                    const active = pathname === center.href;
                    return (
                        <Link
                            href={center.href}
                            aria-label={center.label}
                            className={`relative -mt-8 inline-grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_8px_20px_rgba(56,189,248,0.45)] ${active ? "bg-gradient-to-br from-sky-400 to-violet-500" : "bg-gradient-to-br from-sky-500/70 to-violet-600/70"
                                }`}
                        >
                            <center.icon className="h-6 w-6" strokeWidth={2.5} />
                        </Link>
                    );
                })()}

                {items.slice(3).map((item) => (
                    <BarButton key={item.href} {...item} active={pathname === item.href} />
                ))}
            </div>
        </nav>
    );
}

function BarButton({
    href,
    label,
    icon: Icon,
    active,
}: {
    href: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            aria-label={label}
            className={`inline-grid place-items-center px-2 py-1 ${active ? "text-sky-300" : "text-zinc-400"}`}
        >
            <Icon className="h-5 w-5" strokeWidth={2} />
        </Link>
    );
}
