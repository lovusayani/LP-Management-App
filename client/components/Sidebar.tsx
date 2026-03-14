"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logoutUser } from "@/mvc/frontend/controllers/auth.controller";

const menuItems = [
    { href: "/dashboard/about", label: "About" },
    { href: "/dashboard/help", label: "Help" },
    { href: "/dashboard/support", label: "Support" },
    { href: "/dashboard/faq", label: "FAQ" },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const onLogout = async () => {
        await logoutUser();
        router.replace("/login");
    };

    const content = (
        <div className="flex h-full flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Menu</p>
                <h2 className="mt-2 text-lg font-semibold">LP Navigation</h2>
            </div>
            <nav className="flex flex-1 flex-col gap-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-xl px-3 py-2 text-sm ${pathname === item.href ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:bg-zinc-800"
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
            <button onClick={onLogout} className="btn-secondary w-full">
                Logout
            </button>
        </div>
    );

    return (
        <aside className="relative z-50 hidden w-64 lg:block">{content}</aside>
    );
};
