"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
    AdminLpUser,
    getAdminNotificationOverview,
    getAllLpUsers,
    sendAdminPushToAllUsers,
    sendAdminPushToSingleUser,
    updateAdminUserPushPreference,
} from "@/services/admin.service";

type MessageForm = {
    title: string;
    body: string;
    url: string;
};

const defaultForm: MessageForm = {
    title: "L Max Update",
    body: "You have a new notification.",
    url: "/dashboard",
};

export default function AdminNotificationPage() {
    const [users, setUsers] = useState<AdminLpUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [pushPreferenceUserId, setPushPreferenceUserId] = useState("");
    const [overview, setOverview] = useState({
        serverConfigured: false,
        totalLpUsers: 0,
        usersWithPushEnabled: 0,
        totalTokens: 0,
    });
    const [form, setForm] = useState<MessageForm>(defaultForm);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [sendingAll, setSendingAll] = useState(false);
    const [sendingSingle, setSendingSingle] = useState(false);
    const [updatingPreference, setUpdatingPreference] = useState(false);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedUserId) || null,
        [selectedUserId, users]
    );

    const pushPreferenceUser = useMemo(
        () => users.find((user) => user.id === pushPreferenceUserId) || null,
        [pushPreferenceUserId, users]
    );

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [usersData, overviewData] = await Promise.all([
                getAllLpUsers(),
                getAdminNotificationOverview(),
            ]);

            setUsers(usersData);
            setOverview(overviewData);

            if (!selectedUserId && usersData.length > 0) {
                setSelectedUserId(usersData[0].id);
            }

            if (!pushPreferenceUserId && usersData.length > 0) {
                setPushPreferenceUserId(usersData[0].id);
            }
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load notification data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onSendAll = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSendingAll(true);
        setMessage("");
        setError("");

        try {
            const result = await sendAdminPushToAllUsers({
                title: form.title,
                body: form.body,
                url: form.url || "/dashboard",
            });

            setMessage(
                `Broadcast sent: ${result.successCount}/${result.requested} delivered` +
                (result.failureCount ? `, ${result.failureCount} failed` : "")
            );
            await loadData();
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : "Failed to send broadcast");
        } finally {
            setSendingAll(false);
        }
    };

    const onSendSingle = async () => {
        if (!selectedUserId) {
            setError("Please select a user");
            return;
        }

        setSendingSingle(true);
        setMessage("");
        setError("");

        try {
            const result = await sendAdminPushToSingleUser(selectedUserId, {
                title: form.title,
                body: form.body,
                url: form.url || "/dashboard",
            });

            setMessage(
                `Single user push sent: ${result.successCount}/${result.requested} delivered` +
                (result.failureCount ? `, ${result.failureCount} failed` : "")
            );
            await loadData();
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : "Failed to send user notification");
        } finally {
            setSendingSingle(false);
        }
    };

    const onTogglePushPreference = async (enabled: boolean) => {
        if (!pushPreferenceUserId) {
            setError("Please select a user");
            return;
        }

        setUpdatingPreference(true);
        setMessage("");
        setError("");

        try {
            const result = await updateAdminUserPushPreference(pushPreferenceUserId, enabled);
            setMessage(result.message);
            await loadData();
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Failed to update push setting");
        } finally {
            setUpdatingPreference(false);
        }
    };

    if (loading) {
        return (
            <section className="card">
                <p className="text-zinc-400">Loading notification center...</p>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div className="card space-y-3">
                <div>
                    <h1 className="text-2xl font-semibold">Notification</h1>
                    <p className="text-sm text-zinc-400">Send push messages and manage user push preference.</p>
                </div>

                <div className="grid gap-2 text-sm text-zinc-300 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-zinc-800 px-3 py-2">Server: {overview.serverConfigured ? "Ready" : "Missing"}</div>
                    <div className="rounded-lg border border-zinc-800 px-3 py-2">LP Users: {overview.totalLpUsers}</div>
                    <div className="rounded-lg border border-zinc-800 px-3 py-2">Push Enabled Users: {overview.usersWithPushEnabled}</div>
                    <div className="rounded-lg border border-zinc-800 px-3 py-2">Registered Devices: {overview.totalTokens}</div>
                </div>
            </div>

            <form className="card space-y-3" onSubmit={onSendAll}>
                <h2 className="text-lg font-semibold">Send Notification</h2>

                <div className="space-y-1">
                    <label className="text-sm text-zinc-300">Title</label>
                    <input
                        className="input"
                        value={form.title}
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-zinc-300">Message</label>
                    <textarea
                        className="input min-h-24"
                        value={form.body}
                        onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-zinc-300">Open URL</label>
                    <input
                        className="input"
                        value={form.url}
                        onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                        placeholder="/dashboard"
                    />
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">Select Single User (optional)</label>
                        <select
                            className="input"
                            value={selectedUserId}
                            onChange={(event) => setSelectedUserId(event.target.value)}
                        >
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn-primary" disabled={sendingAll || !overview.serverConfigured}>
                        {sendingAll ? "Sending..." : "Send To All"}
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onSendSingle}
                        disabled={sendingSingle || !overview.serverConfigured || !selectedUser}
                    >
                        {sendingSingle ? "Sending..." : "Send To One"}
                    </button>
                </div>
            </form>

            <div className="card space-y-3">
                <h2 className="text-lg font-semibold">Push Setting</h2>

                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">LP User</label>
                        <select
                            className="input"
                            value={pushPreferenceUserId}
                            onChange={(event) => setPushPreferenceUserId(event.target.value)}
                        >
                            {users.map((user) => (
                                <option key={`pref-${user.id}`} value={user.id}>
                                    {user.fullName} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onTogglePushPreference(true)}
                        disabled={updatingPreference || !pushPreferenceUser || pushPreferenceUser.settings?.alerts === true}
                    >
                        Enable
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onTogglePushPreference(false)}
                        disabled={updatingPreference || !pushPreferenceUser || pushPreferenceUser.settings?.alerts === false}
                    >
                        Disable
                    </button>
                </div>

                {pushPreferenceUser && (
                    <p className="text-sm text-zinc-400">
                        Current status for {pushPreferenceUser.fullName}: {pushPreferenceUser.settings?.alerts ? "Enabled" : "Disabled"}
                    </p>
                )}
            </div>

            {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}
            {message && <p className="rounded-lg bg-green-500/10 p-2 text-sm text-green-300">{message}</p>}
        </section>
    );
}
