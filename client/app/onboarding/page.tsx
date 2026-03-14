"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useHydratedUser } from "@/hooks/useHydratedUser";
import { getNextRoute } from "@/services/session.service";
import { completeOnboarding } from "@/services/user.service";

const slides = [
    { title: "Welcome", description: "Secure LP experience designed for clarity and speed." },
    { title: "Profile", description: "Keep your details updated for compliance and reporting." },
    { title: "KYC", description: "Submit required documents to unlock transactions." },
    { title: "Dashboard", description: "Use profile, deposit, withdraw, and settings modules." },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { loading, user } = useHydratedUser();
    const [index, setIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }
        if (!user) {
            router.replace("/login");
            return;
        }
        if (user.mustChangePassword || user.onboardingCompleted) {
            router.replace(getNextRoute(user));
        }
    }, [loading, router, user]);

    const complete = async () => {
        setSubmitting(true);
        await completeOnboarding();
        router.replace("/kyc");
    };

    const onNext = async () => {
        if (index < slides.length - 1) {
            setIndex((prev) => prev + 1);
            return;
        }
        await complete();
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="card w-full max-w-xl space-y-6">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Onboarding {index + 1}/4</p>
                <div>
                    <h1 className="text-2xl font-semibold">{slides[index].title}</h1>
                    <p className="mt-2 text-sm text-zinc-400">{slides[index].description}</p>
                </div>

                <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                        className="h-2 rounded-full bg-zinc-100"
                        style={{ width: `${((index + 1) / slides.length) * 100}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button className="btn-secondary" onClick={complete} disabled={submitting}>
                        Skip
                    </button>
                    <button className="btn-primary" onClick={onNext} disabled={submitting}>
                        {index === slides.length - 1 ? "Finish" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}
