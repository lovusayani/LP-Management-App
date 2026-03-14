"use client";

import { useEffect } from "react";

import { subscribeToForegroundPushMessages } from "@/services/push-notifications.service";

export default function ForegroundPushListener() {
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const attach = async () => {
            unsubscribe = await subscribeToForegroundPushMessages((payload) => {
                if (typeof window === "undefined") {
                    return;
                }

                const title = payload.notification?.title || payload.data?.title || "L Max Notification";
                const body = payload.notification?.body || payload.data?.body || "You have a new update.";
                const url = payload.data?.url || "/dashboard";

                if (Notification.permission !== "granted" || !("serviceWorker" in navigator)) {
                    return;
                }

                navigator.serviceWorker.getRegistration().then((registration) => {
                    if (!registration) {
                        return;
                    }

                    registration.showNotification(title, {
                        body,
                        icon: payload.notification?.icon || "/favicon.ico",
                        data: { url },
                    });
                });
            });
        };

        attach();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return null;
}
