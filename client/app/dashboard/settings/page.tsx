"use client";

import { FormEvent, useEffect, useState } from "react";

import { useHydratedUser } from "@/hooks/useHydratedUser";
import {
    disablePushNotifications,
    enablePushNotifications,
} from "@/services/push-notifications.service";
import { updateSettings } from "@/services/user.service";
import { UserSettings } from "@/types";
import { FRONTEND_THEME_EVENT, FRONTEND_THEME_KEY } from "@/components/theme/FrontendThemeController";

const saveFrontendTheme = (theme: UserSettings["theme"]) => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(FRONTEND_THEME_KEY, theme);
    window.dispatchEvent(new Event(FRONTEND_THEME_EVENT));
};

export default function SettingsPage() {
    const { user } = useHydratedUser();
    const [form, setForm] = useState<UserSettings>({
        theme: "dark",
        fontSize: 16,
        notificationSound: true,
        alerts: true,
    });
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.settings) {
            setForm(user.settings);
            saveFrontendTheme(user.settings.theme);
            document.documentElement.style.fontSize = `${user.settings.fontSize}px`;
        }
    }, [user]);

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            const updated = await updateSettings(form);

            if (updated.alerts) {
                await enablePushNotifications().catch(() => undefined);
            } else {
                await disablePushNotifications().catch(() => undefined);
            }

            saveFrontendTheme(updated.theme);
            document.documentElement.style.fontSize = `${updated.fontSize}px`;
            setMessage("Settings saved");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="card space-y-4" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">Settings</h1>

            <div className="space-y-2">
                <label className="text-sm text-zinc-300">Theme</label>
                <select
                    className="input"
                    value={form.theme}
                    onChange={(event) => setForm((prev) => ({ ...prev, theme: event.target.value as UserSettings["theme"] }))}
                >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-zinc-300">Font Size ({form.fontSize}px)</label>
                <input
                    type="range"
                    min={12}
                    max={22}
                    value={form.fontSize}
                    onChange={(event) => setForm((prev) => ({ ...prev, fontSize: Number(event.target.value) }))}
                    className="w-full"
                />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2">
                <span>Notification Sound</span>
                <input
                    type="checkbox"
                    checked={form.notificationSound}
                    onChange={(event) =>
                        setForm((prev) => ({ ...prev, notificationSound: event.target.checked }))
                    }
                />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2">
                <span>Push Notifications</span>
                <input
                    type="checkbox"
                    checked={form.alerts}
                    onChange={(event) => setForm((prev) => ({ ...prev, alerts: event.target.checked }))}
                />
            </label>

            {message && <p className="text-sm text-zinc-400">{message}</p>}
            <button className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
            </button>
        </form>
    );
}
