"use client";

import { ReactNode, useLayoutEffect, useState } from "react";

import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { BrokerBottomBar } from "@/design/components/BrokerBottomBar";

export function BrokerPageFrame({ title, children }: { title: string; children: ReactNode }) {
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
        <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(ellipse_120%_60%_at_50%_0%,_#1a3392_0%,_#0c1a58_28%,_#050b30_58%,_#02051c_100%)] pb-32">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/30 blur-[90px]" />
            <div className="pointer-events-none absolute top-40 -left-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[100px]" />
            <div className="pointer-events-none absolute top-72 -right-16 h-64 w-64 rounded-full bg-sky-500/20 blur-[100px]" />

            <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                <div
                    className="pointer-events-auto mx-auto"
                    style={deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined}
                >
                    <DashboardTopbar title={title} showBack />
                </div>
            </div>

            <div className="relative z-10 mt-24 space-y-4 px-4">{children}</div>

            <BrokerBottomBar deviceWidth={deviceWidth} />
        </div>
    );
}
