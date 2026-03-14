"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { loginUser } from "@/mvc/admin/controllers/auth.controller";
import { clearSession } from "@/mvc/admin/models/session.model";
import { useHydratedUser } from "@/hooks/useHydratedUser";

export default function AdminLoginPage() {
    const router = useRouter();
    const { loading, user } = useHydratedUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (user) {
            const currentRole = String((user as { role?: string }).role || "");
            router.replace(currentRole === "admin" ? "/admin" : "/dashboard");
        }
    }, [loading, router, user]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const loggedInUser = await loginUser(email, password);
            const loggedInRole = String((loggedInUser as { role?: string }).role || "");

            if (loggedInRole !== "admin") {
                clearSession();
                throw new Error("Admin access only");
            }

            router.replace("/admin");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Admin login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
                {/* ** Header ** */}
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <BrandLogo
                            variant="light"
                            fallbackText="LMAX Admin"
                            className="h-[74px] w-auto max-w-[270px] object-contain"
                            wrapperClassName="text-2xl font-semibold text-white"
                        />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Admin Panel</p>
                    <h1 className="mt-2 text-2xl font-semibold">Admin Login</h1>
                </div>

                {/* ** Email Field ** */}
                <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Email</label>
                    <input
                        className="input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                {/* ** Password Field ** */}
                <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Password</label>
                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                {/* ** Error Message ** */}
                {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}

                {/* ** Submit Button ** */}
                <button disabled={submitting} className="btn-primary w-full">
                    {submitting ? "Signing in..." : "Login as Admin"}
                </button>
            </form>
        </div>
    );
}
