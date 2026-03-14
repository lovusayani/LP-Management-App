"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useHydratedUser } from "@/hooks/useHydratedUser";
import { getNextRoute } from "@/mvc/frontend/models/session.model";
import { DashboardBottomBar } from "@/mvc/frontend/views/dashboard/bottom-bar.view";
import { Sidebar } from "@/mvc/frontend/views/navigation/sidebar.view";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { loading, user } = useHydratedUser();
    const isDevPreview = process.env.NODE_ENV === "development";
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);

    useLayoutEffect(() => {
        const updateWidth = () => {
            setDeviceWidth(window.innerWidth || document.documentElement.clientWidth || 360);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user && !isDevPreview) {
            router.replace("/login");
            return;
        }

        if (!user && isDevPreview) {
            return;
        }

        const expected = getNextRoute(user);
        if (expected !== "/dashboard") {
            router.replace(expected);
        }
    }, [isDevPreview, loading, router, user]);

    if (loading) {
        return (
            /** Loading State */
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-zinc-400">Loading dashboard...</p>
            </div>
        );
    }

    if (!user && isDevPreview) {
        return (
            <div className="mx-auto flex min-h-screen w-full max-w-none gap-0 bg-[radial-gradient(circle_at_top,_#11286f_0%,_#02083f_32%,_#02062b_72%,_#01041f_100%)] px-0 pb-24 pt-0 lg:max-w-7xl lg:gap-4 lg:px-4 lg:pb-8 lg:pt-6">
                {/* ** Sidebar ** */}
                <Sidebar />
                {/* ** Page Content ** */}
                <main className="flex-1 bg-transparent">{children}</main>
                {/* ** Bottom Bar ** */}
                <DashboardBottomBar deviceWidth={deviceWidth} />
            </div>
        );
    }

    if (!user || getNextRoute(user) !== "/dashboard") {
        return (
            /** Redirect Loading State */
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-zinc-400">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-none gap-0 bg-[radial-gradient(circle_at_top,_#11286f_0%,_#02083f_32%,_#02062b_72%,_#01041f_100%)] px-0 pb-24 pt-0 lg:max-w-7xl lg:gap-4 lg:px-4 lg:pb-8 lg:pt-6">
            {/* ** Sidebar ** */}
            <Sidebar />
            {/* ** Page Content ** */}
            <main className="flex-1 bg-transparent">{children}</main>
            {/* ** Bottom Bar ** */}
            <DashboardBottomBar deviceWidth={deviceWidth} />
        </div>
    );
}
