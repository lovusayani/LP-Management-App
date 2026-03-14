"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { changeUserPassword } from "@/services/auth.service";
import { getNextRoute } from "@/services/session.service";
import { useHydratedUser } from "@/hooks/useHydratedUser";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { loading, user } = useHydratedUser();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }
        if (!user) {
            router.replace("/login");
            return;
        }
        if (!user.mustChangePassword) {
            router.replace(getNextRoute(user));
        }
    }, [loading, router, user]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            await changeUserPassword(currentPassword, newPassword);
            setSuccess("Password updated. Redirecting...");
            setTimeout(() => router.replace("/onboarding"), 700);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Could not update password");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
                <h1 className="text-2xl font-semibold">Reset password</h1>
                <p className="text-sm text-zinc-400">First login requires a password change.</p>

                <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Current Password</label>
                    <input
                        className="input"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-zinc-300">New Password</label>
                    <input
                        className="input"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        minLength={8}
                        required
                    />
                </div>

                {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}
                {success && <p className="rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-300">{success}</p>}

                <button className="btn-primary w-full" disabled={submitting}>
                    {submitting ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}
