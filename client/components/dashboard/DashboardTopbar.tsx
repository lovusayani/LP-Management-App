"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

import { logoutUser } from "@/mvc/frontend/controllers/auth.controller";

const menuItems = [
    { href: "/dashboard/about", label: "About" },
    { href: "/dashboard/help", label: "Help" },
    { href: "/dashboard/support", label: "Support" },
    { href: "/dashboard/faq", label: "FAQ" },
];

interface DashboardTopbarProps {
    title?: string;
    showBack?: boolean;
}

export const DashboardTopbar = ({ title = "L Max", showBack = false }: DashboardTopbarProps) => {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const onLogout = async () => {
        await logoutUser();
        setOpen(false);
        router.replace("/login");
    };

    return (
        <>
            <div
                className="
                    relative z-20 w-full
                    rounded-bl-2xl rounded-br-2xl
                    border-b border-[#6B6BC9]
                    bg-[#060A1B]/10
                    shadow-[0_8px_20px_rgba(0,0,0,0.35)]
                    pb-2
                    pt-[calc(0.75rem+env(safe-area-inset-top))]
                "
                style={{
                    paddingLeft: "max(1rem, env(safe-area-inset-left))",
                    paddingRight: "max(1rem, env(safe-area-inset-right))",
                }}
            >
                <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        {showBack && (
                            <button
                                type="button"
                                aria-label="Go back"
                                onClick={() => router.back()}
                                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 bg-black/20 text-white transition-colors hover:bg-white/10"
                            >
                                <ArrowLeft className="h-5 w-5" strokeWidth={2} />
                            </button>
                        )}

                        <div className="min-w-0 truncate text-[clamp(1.45rem,6.8vw,2.4rem)] font-semibold leading-tight tracking-tight text-white">
                            {title}
                        </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
                        <button
                            type="button"
                            aria-label="Notifications"
                            className="inline-grid h-9 w-9 place-items-center rounded-md border border-white/15 bg-black/20 text-white transition-colors hover:bg-white/10"
                        >
                            <Bell className="h-5 w-5" strokeWidth={2} />
                        </button>

                        <button
                            type="button"
                            aria-label="Logout"
                            onClick={onLogout}
                            className="inline-grid h-9 w-9 place-items-center rounded-md border border-white/15 bg-black/20 text-white transition-colors hover:bg-white/10"
                        >
                            <LogOut className="h-5 w-5" strokeWidth={2} />
                        </button>

                        <button
                            type="button"
                            aria-label="Open menu"
                            onClick={() => setOpen(true)}
                            className="inline-grid h-9 w-9 place-items-center rounded-md border border-white/15 bg-black/20 text-white transition-colors hover:bg-white/10"
                        >
                            <Menu className="h-5 w-5" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm lg:hidden">
                    <div className="relative z-[210] ml-auto flex h-[100dvh] w-[82%] max-w-[320px] flex-col border-l border-zinc-700 bg-[#090f2b]">
                        <div className="mb-5 flex items-center justify-between px-4 pt-4">
                            <h2 className="text-lg font-semibold text-white">Menu</h2>
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={() => setOpen(false)}
                                className="rounded-md p-1 text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto px-4 pb-4">
                            <div className="flex flex-col gap-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="rounded-lg border border-zinc-700/70 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        <div
                            className="border-t border-zinc-700/70 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
                            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                        >
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
