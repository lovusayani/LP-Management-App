"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Users, X } from "lucide-react";

import {
    AdminLpUser,
    ApiSourceRecord,
    createAdminApiSource,
    deleteAdminApiSource,
    getAdminApiSources,
    getAllLpUsers,
    setAdminApiSourceUsers,
    updateAdminApiSource,
} from "@/services/admin.service";

function AddSourceForm({ onCreated }: { onCreated: (source: ApiSourceRecord) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [authHeader, setAuthHeader] = useState<"x-api-key" | "bearer">("x-api-key");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const reset = () => {
        setName("");
        setBaseUrl("");
        setApiKey("");
        setAuthHeader("x-api-key");
        setError("");
    };

    const onSubmit = async () => {
        setError("");
        if (!name.trim() || !baseUrl.trim() || !apiKey.trim()) {
            setError("Name, base URL and API key are required.");
            return;
        }
        setSubmitting(true);
        try {
            const created = await createAdminApiSource({ name: name.trim(), baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), authHeader });
            onCreated(created);
            reset();
            setOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create API source.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30"
            >
                <Plus className="h-4 w-4" />
                Add API Source
            </button>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100">New API Source</h2>
                <button type="button" onClick={() => { setOpen(false); reset(); }} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                    <span className="text-zinc-300">Source Name</span>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Suimfx"
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-violet-500/60"
                    />
                </label>

                <label className="grid gap-1 text-sm">
                    <span className="text-zinc-300">Auth Header</span>
                    <select
                        value={authHeader}
                        onChange={(e) => setAuthHeader(e.target.value as "x-api-key" | "bearer")}
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                    >
                        <option value="x-api-key">X-API-Key header</option>
                        <option value="bearer">Authorization: Bearer</option>
                    </select>
                </label>

                <label className="grid gap-1 text-sm md:col-span-2">
                    <span className="text-zinc-300">Base URL</span>
                    <input
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.example.com/api/v1/trades"
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-violet-500/60"
                    />
                </label>

                <label className="grid gap-1 text-sm md:col-span-2">
                    <span className="text-zinc-300">API Key</span>
                    <input
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="suimfx_xxxxxxxx..."
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-violet-500/60"
                    />
                </label>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setOpen(false); reset(); }} className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className="rounded-md border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? "Saving..." : "Create Source"}
                </button>
            </div>
        </div>
    );
}

function ManageUsersModal({
    source,
    lpUsers,
    onClose,
    onSaved,
}: {
    source: ApiSourceRecord;
    lpUsers: AdminLpUser[];
    onClose: () => void;
    onSaved: (updated: ApiSourceRecord) => void;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set(source.assignedUsers.map((u) => u.id)));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const onSave = async () => {
        setSaving(true);
        setError("");
        try {
            const updated = await setAdminApiSourceUsers(source.id, Array.from(selected));
            onSaved(updated);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update assigned users.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Manage Access</h2>
                        <p className="text-xs text-zinc-400">{source.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:bg-zinc-800">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-80 space-y-1 overflow-y-auto">
                    {lpUsers.length === 0 ? (
                        <p className="text-sm text-zinc-400">No LP users found.</p>
                    ) : (
                        lpUsers.map((user) => (
                            <label
                                key={user.id}
                                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-800/70"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(user.id)}
                                    onChange={() => toggle(user.id)}
                                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-violet-500"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm text-zinc-100">{user.fullName}</span>
                                    <span className="block truncate text-xs text-zinc-500">{user.email}</span>
                                </span>
                            </label>
                        ))
                    )}
                </div>

                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800" disabled={saving}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Access"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminTradeBrokerApiPage() {
    const [sources, setSources] = useState<ApiSourceRecord[]>([]);
    const [lpUsers, setLpUsers] = useState<AdminLpUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [managingSource, setManagingSource] = useState<ApiSourceRecord | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const [sourceList, users] = await Promise.all([getAdminApiSources(), getAllLpUsers()]);
            setSources(sourceList);
            setLpUsers(users);
        } catch {
            setError("Failed to load API sources.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onToggleActive = async (source: ApiSourceRecord) => {
        setBusyId(source.id);
        try {
            const updated = await updateAdminApiSource(source.id, { isActive: !source.isActive });
            setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        } catch {
            setError(`Failed to update "${source.name}".`);
        } finally {
            setBusyId(null);
        }
    };

    const onDelete = async (source: ApiSourceRecord) => {
        if (!window.confirm(`Delete API source "${source.name}"? Users assigned to it will lose access to its trades.`)) return;
        setBusyId(source.id);
        try {
            await deleteAdminApiSource(source.id);
            setSources((prev) => prev.filter((s) => s.id !== source.id));
        } catch {
            setError(`Failed to delete "${source.name}".`);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Trade Broker · Api</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Manage external trade-feed API credentials and control which LP users can view each source&apos;s data.
                    </p>
                </div>
                <AddSourceForm onCreated={(created) => setSources((prev) => [created, ...prev])} />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {loading ? (
                <p className="text-sm text-zinc-400">Loading...</p>
            ) : sources.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-8 text-center">
                    <p className="text-sm text-zinc-400">No API sources yet. Add one to start feeding live trades to LP users.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sources.map((source) => (
                        <div key={source.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-zinc-100">{source.name}</h3>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${source.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-700/40 text-zinc-400"
                                                }`}
                                        >
                                            {source.isActive ? "Active" : "Disabled"}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-xs text-zinc-500">{source.baseUrl}</p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        Key: <span className="font-mono">{source.apiKeyMasked}</span> · Header:{" "}
                                        {source.authHeader === "bearer" ? "Authorization: Bearer" : "X-API-Key"}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onToggleActive(source)}
                                        disabled={busyId === source.id}
                                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                                    >
                                        {source.isActive ? "Disable" : "Enable"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setManagingSource(source)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        Manage Access
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(source)}
                                        disabled={busyId === source.id}
                                        className="inline-grid h-8 w-8 place-items-center rounded-md border border-red-800 text-red-400 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {source.assignedUsers.length === 0 ? (
                                    <span className="text-xs text-zinc-500">No users assigned yet.</span>
                                ) : (
                                    source.assignedUsers.map((user) => (
                                        <span
                                            key={user.id}
                                            className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300"
                                            title={user.email}
                                        >
                                            {user.fullName}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {managingSource && (
                <ManageUsersModal
                    source={managingSource}
                    lpUsers={lpUsers}
                    onClose={() => setManagingSource(null)}
                    onSaved={(updated) => setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
                />
            )}
        </section>
    );
}
