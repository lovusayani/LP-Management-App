"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, KeyRound, Loader2, LogOut, PanelLeftClose, PanelLeftOpen, Palette, Settings2, UserCircle2, X } from "lucide-react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { useHydratedUser } from "@/hooks/useHydratedUser";
import { logoutUser } from "@/mvc/admin/controllers/auth.controller";
import { isAdminUser } from "@/mvc/admin/models/session.model";
import { changeUserPassword } from "@/services/auth.service";
import { getSession } from "@/services/session.service";

// ── nav structure ─────────────────────────────────────────────────────────────

const topLinks = [
    { href: "/admin", label: "Home" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/notification", label: "Notification" },
    { href: "/admin/prof-loss", label: "Prof/Loss" },
];

const setupLinks = [
    { href: "/admin/setup", label: "Setup" },
    { href: "/admin/page-setup", label: "Page Setup" },
    { href: "/admin/payment-setup", label: "Payment Setup" },
    { href: "/admin/wallets/pnl-uploads", label: "PnL Uploads" },
];

const walletLinks = [
    { href: "/admin/wallets", label: "All Wallets" },
    { href: "/admin/wallets/deposits", label: "Deposites" },
    { href: "/admin/wallets/withdrawals", label: "Withdrawls" },
];

type HeaderTheme = "system" | "dark" | "light" | "rose";

const THEME_STORAGE_KEY = "lmax_admin_theme";

const THEME_LABELS: Record<HeaderTheme, string> = {
    system: "Default System color",
    dark: "Dark",
    light: "Light",
    rose: "Rose",
};

// ── change password modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const onSubmit = async () => {
        setError("");
        setSuccess("");
        if (!current || !next || !confirm) {
            setError("All fields are required.");
            return;
        }
        if (next.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }
        if (next !== confirm) {
            setError("New passwords do not match.");
            return;
        }
        setSubmitting(true);
        try {
            await changeUserPassword(current, next);
            setSuccess("Password changed successfully.");
            setCurrent(""); setNext(""); setConfirm("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            setError(msg || "Failed to change password. Check current password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-violet-400" />
                        <h2 className="text-lg font-semibold text-white">Change Password</h2>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* current password */}
                    <div className="grid gap-1">
                        <label className="text-xs font-medium text-zinc-400">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60"
                            />
                            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* new password */}
                    <div className="grid gap-1">
                        <label className="text-xs font-medium text-zinc-400">New Password</label>
                        <div className="relative">
                            <input
                                type={showNext ? "text" : "password"}
                                value={next}
                                onChange={(e) => setNext(e.target.value)}
                                placeholder="Min 8 characters"
                                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60"
                            />
                            <button type="button" onClick={() => setShowNext((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* confirm */}
                    <div className="grid gap-1">
                        <label className="text-xs font-medium text-zinc-400">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60"
                        />
                    </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800" disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        {submitting ? "Saving..." : "Update Password"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── collapsible sidebar group ─────────────────────────────────────────────────

function SidebarGroup({
    label,
    links,
    pathname,
}: {
    label: string;
    links: { href: string; label: string }[];
    pathname: string;
}) {
    const isActive = links.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    const [open, setOpen] = useState(isActive);

    useEffect(() => {
        if (isActive) {
            setOpen(true);
        }
    }, [isActive]);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${isActive ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/70"}`}
            >
                {label}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="mt-1 ml-3 space-y-1 border-l border-zinc-700 pl-3">
                    {links.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block rounded px-2 py-1.5 text-xs ${active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/70"}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { loading, user, setUser } = useHydratedUser();
    const isAdminLoginRoute = pathname.startsWith("/admin/login");
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [theme, setTheme] = useState<HeaderTheme>("system");
    const [systemPrefersDark, setSystemPrefersDark] = useState(true);
    const themeMenuRef = useRef<HTMLDivElement | null>(null);
    const adminMenuRef = useRef<HTMLDivElement | null>(null);

    const toggleSidebarMenu = () => setIsMenuOpen((prev) => !prev);
    const toggleThemeMenu = () => { setIsThemeMenuOpen((prev) => !prev); setIsAdminMenuOpen(false); };
    const toggleAdminMenu = () => { setIsAdminMenuOpen((prev) => !prev); setIsThemeMenuOpen(false); };

    useEffect(() => {
        if (isAdminLoginRoute) return;
        if (loading) return;
        if (!user) {
            const persistedUser = getSession()?.user || null;
            if (persistedUser) { setUser(persistedUser); return; }
            router.replace("/admin/login");
            return;
        }
        if (!isAdminUser(user)) router.replace("/dashboard");
    }, [isAdminLoginRoute, loading, router, setUser, user]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setSystemPrefersDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
        const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as HeaderTheme | null;
        const nextTheme: HeaderTheme = storedTheme && ["system", "dark", "light", "rose"].includes(storedTheme) ? storedTheme : "system";
        setTheme(nextTheme);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const onThemeModeChange = () => setSystemPrefersDark(mediaQuery.matches);
        mediaQuery.addEventListener("change", onThemeModeChange);
        return () => mediaQuery.removeEventListener("change", onThemeModeChange);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const onMouseDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (themeMenuRef.current && !themeMenuRef.current.contains(target)) setIsThemeMenuOpen(false);
            if (adminMenuRef.current && !adminMenuRef.current.contains(target)) setIsAdminMenuOpen(false);
        };
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, []);

    const onThemeChange = (nextTheme: HeaderTheme) => {
        setTheme(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        setIsThemeMenuOpen(false);
    };

    const resolvedTheme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

    const onLogout = async () => {
        setIsAdminMenuOpen(false);
        try { await logoutUser(); } finally { router.replace("/admin/login"); }
    };

    const onChangePassword = () => {
        setIsAdminMenuOpen(false);
        setShowChangePassword(true);
    };

    if (isAdminLoginRoute) return <>{children}</>;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-zinc-400">Loading admin workspace...</p>
            </div>
        );
    }

    if (!isAdminUser(user)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-zinc-400">Redirecting to admin login...</p>
            </div>
        );
    }

    return (
        <div className={`admin-theme admin-theme--${resolvedTheme} min-h-screen bg-zinc-950 text-zinc-100`}>
            {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

            {/* ** Topbar ** */}
            <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-zinc-800 bg-zinc-950">
                <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            className="inline-grid h-9 w-9 place-items-center rounded-md border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800"
                            onClick={toggleSidebarMenu}
                        >
                            {isMenuOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        </button>
                        <BrandLogo
                            variant="light"
                            fallbackText="LMAX Admin"
                            className="h-[42px] w-auto max-w-[220px] object-contain"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative" ref={themeMenuRef}>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                                onClick={toggleThemeMenu}
                            >
                                <Palette className="h-3.5 w-3.5" />
                                {THEME_LABELS[theme]}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </button>

                            {isThemeMenuOpen && (
                                <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-lg">
                                    {[
                                        { value: "system", label: "Default System color" },
                                        { value: "dark", label: "Dark" },
                                        { value: "light", label: "Light" },
                                        { value: "rose", label: "Rose" },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={`block w-full rounded-md px-3 py-2 text-left text-xs ${theme === item.value ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/70"}`}
                                            onClick={() => onThemeChange(item.value as HeaderTheme)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={adminMenuRef}>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                                onClick={toggleAdminMenu}
                            >
                                <UserCircle2 className="h-4 w-4" />
                                Admin
                                <ChevronDown className="h-3.5 w-3.5" />
                            </button>

                            {isAdminMenuOpen && (
                                <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-lg">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800/70"
                                        onClick={onChangePassword}
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                        Change Password
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-300 hover:bg-red-900/20"
                                        onClick={onLogout}
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex pt-14">
                {/* ** Sidebar ** */}
                <aside className={`shrink-0 transition-[width] duration-200 ${isMenuOpen ? "w-64" : "w-0"}`}>
                    <div
                        className={`h-[calc(100vh-3.5rem)] overflow-y-auto border-zinc-800 bg-zinc-900/70 ${isMenuOpen ? "border-r p-4" : "border-r-0 p-0"}`}
                    >
                        {isMenuOpen && (
                            <>
                                <div className="mb-6">
                                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Panel</p>
                                    <h2 className="mt-2 text-lg font-semibold">LP Management</h2>
                                </div>

                                <nav className="space-y-1">
                                    {topLinks.map((item) => {
                                        const active = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`block rounded-lg px-3 py-2 text-sm ${active ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/70"}`}
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}

                                    <SidebarGroup
                                        label="Setup"
                                        links={setupLinks}
                                        pathname={pathname}
                                    />

                                    <SidebarGroup
                                        label="Wallets"
                                        links={walletLinks}
                                        pathname={pathname}
                                    />
                                </nav>
                            </>
                        )}
                    </div>
                </aside>

                {/* ** Page Content ** */}
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
