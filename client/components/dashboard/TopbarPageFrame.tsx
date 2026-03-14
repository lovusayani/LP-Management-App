"use client";

import { ReactNode, useLayoutEffect, useState } from "react";

import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";

export function TopbarPageFrame({ title, children }: { title: string; children: ReactNode }) {
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);

    useLayoutEffect(() => {
        const updateWidth = () => {
            setDeviceWidth(window.innerWidth || document.documentElement.clientWidth || 360);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    return (
        <div className="min-h-screen w-full pb-28">
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                <div
                    className="pointer-events-auto mx-auto"
                    style={deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined}
                >
                    <DashboardTopbar title={title} showBack />
                </div>
            </div>

            <section className="card mt-24 space-y-4">{children}</section>
        </div>
    );
}