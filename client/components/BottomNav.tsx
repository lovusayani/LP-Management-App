"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, House, Settings2, Wallet2 } from "lucide-react";

const items = [
    { href: "/dashboard/profile", label: "Profile", icon: CircleUserRound },
    { href: "/dashboard/performance", label: "Deposit", icon: Settings2 },
    { href: "/dashboard", label: "Home", icon: House, isCenter: true },
    { href: "/dashboard/withdraw", label: "Withdraw", icon: Wallet2 },
    { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
];

export const BottomNav = () => {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:left-64">
            <div className="relative overflow-hidden border-t border-zinc-600/30 bg-gradient-to-t from-[#2b2f3b] to-[#3a4050]/90 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6 sm:pt-8">
                <div className="absolute -left-[14%] -top-[72%] aspect-square w-[52%] rounded-full bg-[#11152f]" />
                <div className="absolute -right-[14%] -top-[72%] aspect-square w-[52%] rounded-full bg-[#11152f]" />

                <ul className="relative z-10 mx-auto grid w-full grid-cols-5 items-end px-3">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <li key={item.href} className="text-center text-zinc-200">
                                <Link
                                    href={item.href}
                                    className={`inline-flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] ${item.isCenter
                                        ? "-mt-12 rounded-full bg-gradient-to-b from-[#2d35ff] to-[#0913ad] p-4 text-white shadow-[0_12px_24px_rgba(5,8,33,0.8)] sm:-mt-16 sm:p-5"
                                        : active
                                            ? "text-zinc-100"
                                            : "text-zinc-300"
                                        }`}
                                >
                                    <Icon className={item.isCenter ? "h-6 w-6 sm:h-8 sm:w-8" : "h-5 w-5 sm:h-6 sm:w-6"} />
                                    {!item.isCenter && <span className="sr-only">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};
