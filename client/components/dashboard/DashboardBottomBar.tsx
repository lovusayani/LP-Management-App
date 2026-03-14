"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bolt, ChartCandlestick, CircleUserRound, House, Wallet } from "lucide-react";

const items = [
    { href: "/dashboard/profile", label: "Profile", icon: CircleUserRound },
    { href: "/dashboard/performance", label: "Chart", icon: ChartCandlestick },
    { href: "/dashboard", label: "Home", icon: House, isCenter: true },
    { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
    { href: "/dashboard/settings", label: "Settings", icon: Bolt },
];

export const DashboardBottomBar = ({ deviceWidth }: { deviceWidth: number | null }) => {
    const pathname = usePathname();


    const barWidth = deviceWidth ? `${deviceWidth}px` : "100vw";

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-30"
            style={{ width: barWidth, minWidth: barWidth, maxWidth: barWidth, margin: "0 auto" }}
        >
            <div className="relative w-full overflow-visible pt-5 sm:pt-6">
                <svg
                    width={deviceWidth ? deviceWidth : "100%"}
                    height="70"
                    viewBox="0 0 440 70"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 w-full"
                >
                    <path
                        d="M4.00001 38.0811C74.8726 -10.4188 368.373 -14.9188 444 38.0811C519.628 91.0809 444 137.081 444 137.081H4.00001C4.00001 137.081 -66.8725 86.581 4.00001 38.0811Z"
                        fill="url(#paint0_linear_116_2)"
                        fillOpacity={1}
                        stroke="#6B6BC9"
                        strokeOpacity={0.35}
                    />
                    <defs>
                        <linearGradient
                            id="paint0_linear_116_2"
                            x1="225.057"
                            y1="137.081"
                            x2="225.057"
                            y2="0"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop stopColor="#030612" stopOpacity="0.98" />
                            <stop offset="1" stopColor="#040816" stopOpacity="0.6" />
                        </linearGradient>
                    </defs>
                </svg>
                <ul className="relative z-10 mx-auto grid w-full grid-cols-5 items-end px-3">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <li key={item.href} className={`text-center text-zinc-200 ${item.isCenter ? "pb-[20px]" : "pb-[18px]"}`}>
                                <Link
                                    href={item.href}
                                    className={`inline-flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] ${item.isCenter ? "text-white" : active ? "text-zinc-100" : "text-zinc-300"
                                        }`}
                                    style={item.isCenter ? { transform: "translateY(-10px)" } : undefined}
                                >
                                    {item.isCenter ? (
                                        <span className="relative inline-grid h-[60px] w-[60px] place-items-center">
                                            <svg
                                                width="76"
                                                height="76"
                                                viewBox="0 0 92 92"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="absolute inset-0 h-full w-full"
                                                aria-hidden="true"
                                            >
                                                <circle cx="46" cy="46" r="46" fill="url(#paint0_linear_23_82)" />
                                                <defs>
                                                    <linearGradient
                                                        id="paint0_linear_23_82"
                                                        x1="46"
                                                        y1="92"
                                                        x2="46"
                                                        y2="0"
                                                        gradientUnits="userSpaceOnUse"
                                                    >
                                                        <stop stopColor="#00165B" />
                                                        <stop offset="1" stopColor="#2314FF" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <Icon className="relative z-10 h-6 w-6" />
                                        </span>
                                    ) : (
                                        <Icon className="h-6 w-6 mt-3" />
                                    )}
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};