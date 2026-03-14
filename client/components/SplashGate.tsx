"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getNextRoute } from "@/services/session.service";
import { useHydratedUser } from "@/hooks/useHydratedUser";

export const SplashGate = () => {
    const router = useRouter();
    const { loading, user } = useHydratedUser();

    useEffect(() => {
        if (loading) {
            return;
        }
        router.replace(getNextRoute(user));
    }, [loading, router, user]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
            <div className="card w-full max-w-md text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">LP Management</p>
                <h1 className="mt-2 text-2xl font-semibold">Loading secure workspace...</h1>
                <p className="mt-3 text-sm text-zinc-400">Validating your access and onboarding state</p>
            </div>
        </div>
    );
};
