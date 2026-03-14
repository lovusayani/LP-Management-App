"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { loginUser } from "@/services/auth.service";
import { enablePushNotifications, hasFirebasePushConfig } from "@/services/push-notifications.service";
import { getNextRoute } from "@/services/session.service";
import { useHydratedUser } from "@/hooks/useHydratedUser";

const CAMERA_PERMISSION_CHECK_KEY = "lp_camera_permission_checked";

const requestCameraPermission = async (): Promise<void> => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        return;
    }

    const maybeNavigator = navigator as Navigator & {
        permissions?: {
            query: (descriptor: PermissionDescriptor) => Promise<{ state: PermissionState }>;
        };
    };

    if (maybeNavigator.permissions?.query) {
        try {
            const status = await maybeNavigator.permissions.query({ name: "camera" as PermissionName });
            if (status.state !== "prompt") {
                return;
            }
        } catch {
            // Fall back to local marker when Permissions API is unavailable for camera.
        }
    } else if (window.localStorage.getItem(CAMERA_PERMISSION_CHECK_KEY) === "true") {
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
    } catch {
        // Permission denied or unavailable camera should not block login.
    } finally {
        window.localStorage.setItem(CAMERA_PERMISSION_CHECK_KEY, "true");
    }
};

const requestPushPermission = async (enabled: boolean): Promise<void> => {
    if (typeof window === "undefined") {
        return;
    }

    if (!enabled) {
        return;
    }

    if (!hasFirebasePushConfig()) {
        return;
    }

    try {
        await enablePushNotifications();
    } catch {
        // Unsupported browser or denied permission should not block login.
    }
};

export default function LoginPage() {
    const router = useRouter();
    const { loading, user } = useHydratedUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.replace(getNextRoute(user));
        }
    }, [loading, router, user]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const loggedInUser = await loginUser(email, password);
            await Promise.allSettled([requestPushPermission(Boolean(loggedInUser.settings?.alerts)), requestCameraPermission()]);
            router.replace(getNextRoute(loggedInUser));
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Login failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        <BrandLogo
                            variant="mobile"
                            fallbackText="LP Management"
                            className="h-[62px] w-auto max-w-[180px] object-contain"
                            wrapperClassName="text-2xl font-semibold text-white"
                        />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">LP Management</p>
                    <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
                </div>

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

                {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}

                <button disabled={submitting} className="btn-primary w-full">
                    {submitting ? "Signing in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
