"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
    AdminLpUser,
    AdminNoticeRecord,
    getAdminNotices,
    getAdminNotificationOverview,
    getAllLpUsers,
    sendAdminNotice,
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

    const [notices, setNotices] = useState<AdminNoticeRecord[]>([]);
    const [noticeTarget, setNoticeTarget] = useState<"all" | "user">("all");
    const [noticeUserId, setNoticeUserId] = useState("");
    const [noticeTitle, setNoticeTitle] = useState("");
    const [noticeMessage, setNoticeMessage] = useState("");
    const [sendingNotice, setSendingNotice] = useState(false);
    const [noticeMessageStatus, setNoticeMessageStatus] = useState("");
    const [noticeError, setNoticeError] = useState("");

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
            const [usersData, overviewData, noticesData] = await Promise.all([
                getAllLpUsers(),
                getAdminNotificationOverview(),
                getAdminNotices(),
            ]);

            setUsers(usersData);
            setOverview(overviewData);
            setNotices(noticesData);

            if (!selectedUserId && usersData.length > 0) {
                setSelectedUserId(usersData[0].id);
            }

            if (!pushPreferenceUserId && usersData.length > 0) {
                setPushPreferenceUserId(usersData[0].id);
            }

            if (!noticeUserId && usersData.length > 0) {
                setNoticeUserId(usersData[0].id);
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

    const onSendNotice = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (noticeTarget === "user" && !noticeUserId) {
            setNoticeError("Please select a user");
            return;
        }

        setSendingNotice(true);
        setNoticeMessageStatus("");
        setNoticeError("");

        try {
            await sendAdminNotice({
                title: noticeTitle,
                message: noticeMessage,
                target: noticeTarget,
                userId: noticeTarget === "user" ? noticeUserId : undefined,
            });

            setNoticeMessageStatus("Notice sent successfully");
            setNoticeTitle("");
            setNoticeMessage("");
            const noticesData = await getAdminNotices();
            setNotices(noticesData);
        } catch (sendError) {
            setNoticeError(sendError instanceof Error ? sendError.message : "Failed to send notice");
        } finally {
            setSendingNotice(false);
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

            <form className="card space-y-3" onSubmit={onSendNotice}>
                <div>
                    <h2 className="text-lg font-semibold">Send Notice</h2>
                    <p className="text-sm text-zinc-400">
                        Posts an in-app notice the user sees via the bell icon on their dashboard. Works
                        regardless of push notification setup.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-zinc-300">Title</label>
                    <input
                        className="input"
                        value={noticeTitle}
                        onChange={(event) => setNoticeTitle(event.target.value)}
                        maxLength={150}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm text-zinc-300">Message</label>
                    <textarea
                        className="input min-h-24"
                        value={noticeMessage}
                        onChange={(event) => setNoticeMessage(event.target.value)}
                        maxLength={2000}
                        required
                    />
                </div>

                <div className="grid gap-2 md:grid-cols-[auto_1fr_auto] md:items-end">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">Send To</label>
                        <select
                            className="input"
                            value={noticeTarget}
                            onChange={(event) => setNoticeTarget(event.target.value as "all" | "user")}
                        >
                            <option value="all">All Users</option>
                            <option value="user">Single User</option>
                        </select>
                    </div>

                    {noticeTarget === "user" && (
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-300">User</label>
                            <select
                                className="input"
                                value={noticeUserId}
                                onChange={(event) => setNoticeUserId(event.target.value)}
                            >
                                {users.map((user) => (
                                    <option key={`notice-${user.id}`} value={user.id}>
                                        {user.fullName} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={sendingNotice}>
                        {sendingNotice ? "Sending..." : "Send Notice"}
                    </button>
                </div>

                {noticeError && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{noticeError}</p>}
                {noticeMessageStatus && (
                    <p className="rounded-lg bg-green-500/10 p-2 text-sm text-green-300">{noticeMessageStatus}</p>
                )}

                {notices.length > 0 && (
                    <div className="space-y-2 border-t border-zinc-800 pt-3">
                        <p className="text-sm font-medium text-zinc-300">Recently Sent</p>
                        <div className="space-y-2">
                            {notices.slice(0, 8).map((notice) => (
                                <div key={notice.id} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-zinc-100">{notice.title}</span>
                                        <span className="shrink-0 text-xs text-zinc-500">
                                            {notice.target === "all" ? "All Users" : notice.targetUser?.fullName || "User"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-zinc-400">{notice.message}</p>
                                    <p className="mt-1 text-xs text-zinc-600">
                                        {new Date(notice.createdAt).toLocaleString()} · Read by {notice.readCount}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </form>

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
