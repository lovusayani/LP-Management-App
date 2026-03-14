"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FrontendTheme = "dark" | "light" | "system";

export const FRONTEND_THEME_KEY = "lmax_frontend_theme";
export const FRONTEND_THEME_EVENT = "lmax-frontend-theme-changed";

const isTheme = (value: string | null): value is FrontendTheme => {
    return value === "dark" || value === "light" || value === "system";
};

const applyFrontendTheme = (theme: FrontendTheme, enabled: boolean) => {
    const root = document.documentElement;
    root.classList.remove("dark", "light", "rose");

    if (!enabled) {
        return;
    }

    if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(prefersDark ? "dark" : "light");
        return;
    }

    root.classList.add(theme);
};

export function FrontendThemeController() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<FrontendTheme>("system");

    const isFrontendThemeEnabled = useMemo(() => {
        if (pathname.startsWith("/admin")) {
            return false;
        }

        if (pathname === "/dashboard" || pathname === "/dashboard/") {
            return false;
        }

        return true;
    }, [pathname]);

    useEffect(() => {
        const stored = window.localStorage.getItem(FRONTEND_THEME_KEY);
        setTheme(isTheme(stored) ? stored : "system");
    }, []);

    useEffect(() => {
        applyFrontendTheme(theme, isFrontendThemeEnabled);
    }, [isFrontendThemeEnabled, theme]);

    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== FRONTEND_THEME_KEY) {
                return;
            }
            setTheme(isTheme(event.newValue) ? event.newValue : "system");
        };

        const onThemeUpdate = () => {
            const stored = window.localStorage.getItem(FRONTEND_THEME_KEY);
            setTheme(isTheme(stored) ? stored : "system");
        };

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const onSystemThemeChange = () => {
            if (theme === "system") {
                applyFrontendTheme("system", isFrontendThemeEnabled);
            }
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener(FRONTEND_THEME_EVENT, onThemeUpdate);
        mediaQuery.addEventListener("change", onSystemThemeChange);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener(FRONTEND_THEME_EVENT, onThemeUpdate);
            mediaQuery.removeEventListener("change", onSystemThemeChange);
        };
    }, [isFrontendThemeEnabled, theme]);

    return null;
}
