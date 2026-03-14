"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import {
    AdminLpUser,
    deleteAdminPnlUpload,
    getAdminPnlUploads,
    getAllLpUsers,
    PnlUploadRecord,
    uploadAdminPnlFiles,
} from "@/services/admin.service";

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unit = 0;

    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }

    return `${size.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
};

export default function AdminPnlUploadsPage() {
    const [uploads, setUploads] = useState<PnlUploadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);
    const [bulkUploadMessage, setBulkUploadMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [lpUsers, setLpUsers] = useState<AdminLpUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAdminPnlUploads();
            setUploads(data);
        } catch {
            setError("Failed to load uploads.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let disposed = false;

        const loadUsers = async () => {
            try {
                const users = await getAllLpUsers();
                if (!disposed) {
                    setLpUsers(users);
                }
            } catch {
                if (!disposed) {
                    setLpUsers([]);
                }
            }
        };

        loadUsers();

        return () => {
            disposed = true;
        };
    }, []);

    const onBulkFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []).filter(
            (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        );
        setBulkFiles(files);
        setBulkUploadMessage("");
    };

    const onSubmitBulkUpload = async () => {
        if (!bulkFiles.length) {
            setBulkUploadMessage("Please select at least one PDF file.");
            return;
        }

        if (!selectedUserId) {
            setBulkUploadMessage("Select an LP/User before uploading PDF files.");
            return;
        }

        setUploading(true);
        setBulkUploadMessage("Uploading...");
        try {
            const uploaded = await uploadAdminPnlFiles(bulkFiles, selectedUserId);
            setUploads((prev) => [...uploaded, ...prev]);
            setBulkUploadMessage(`${bulkFiles.length} PDF file(s) uploaded successfully.`);
            setBulkFiles([]);
            setSelectedUserId("");
        } catch {
            setBulkUploadMessage("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const onDelete = async (item: PnlUploadRecord) => {
        if (!window.confirm(`Delete "${item.originalName}"? This cannot be undone.`)) return;
        setDeletingId(item.id);
        try {
            await deleteAdminPnlUpload(item.id);
            setUploads((prev) => prev.filter((u) => u.id !== item.id));
        } catch {
            setError(`Failed to delete "${item.originalName}".`);
        } finally {
            setDeletingId(null);
        }
    };

    const totalFiles = uploads.length;
    const totalSize = useMemo(
        () => uploads.reduce((sum, item) => sum + Number(item.fileSize || 0), 0),
        [uploads]
    );

    return (
        <section className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">PnL Uploads</h1>
                    <p className="mt-1 text-sm text-zinc-400">Upload PDF files here and review the full PnL uploads list below.</p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                    <p>Total Files: {totalFiles}</p>
                    <p>Total Size: {formatBytes(totalSize)}</p>
                </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Bulk Upload PDF</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Upload PDF reports for a specific LP/User. The selected user will see only their assigned reports.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1 text-sm">
                        <span className="text-zinc-300">LP/User</span>
                        <select
                            value={selectedUserId}
                            onChange={(event) => setSelectedUserId(event.target.value)}
                            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                        >
                            <option value="">Select LP/User</option>
                            {lpUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.fullName}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <p className="rounded-md border border-emerald-700/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    PDF uploads are now LP/User wise only.
                </p>

                <input
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    onChange={onBulkFileChange}
                    className="block w-full rounded-md border border-dashed border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-100"
                />

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    {bulkFiles.length === 0 ? (
                        <p className="text-sm text-zinc-400">No PDF selected.</p>
                    ) : (
                        <div className="space-y-2">
                            {bulkFiles.map((file) => (
                                <p key={`${file.name}-${file.size}`} className="text-sm text-zinc-200">
                                    {file.name}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">PDF only. Multiple files allowed.</p>
                    <button
                        type="button"
                        onClick={onSubmitBulkUpload}
                        disabled={uploading}
                        className="rounded-md border border-emerald-700 bg-emerald-700/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {uploading ? "Uploading..." : "Upload PDF"}
                    </button>
                </div>

                {bulkUploadMessage && <p className="text-sm text-emerald-400">{bulkUploadMessage}</p>}
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                            <th className="px-3 py-2 text-left">File Name</th>
                            <th className="px-3 py-2 text-left">LP/User</th>
                            <th className="px-3 py-2 text-left">Size</th>
                            <th className="px-3 py-2 text-left">Uploaded At</th>
                            <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="border-t border-zinc-800">
                                <td colSpan={5} className="px-3 py-4 text-zinc-400">Loading...</td>
                            </tr>
                        ) : uploads.length === 0 ? (
                            <tr className="border-t border-zinc-800">
                                <td colSpan={5} className="px-3 py-4 text-zinc-400">
                                    No uploaded PDF files found.
                                </td>
                            </tr>
                        ) : (
                            uploads.map((item) => (
                                <tr key={item.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2">{item.originalName}</td>
                                    <td className="px-3 py-2 text-zinc-300">{item.targetUserName || "--"}</td>
                                    <td className="px-3 py-2">{formatBytes(item.fileSize)}</td>
                                    <td className="px-3 py-2 text-zinc-300">
                                        {item.uploadedAt ? new Date(item.uploadedAt).toLocaleString() : "--"}
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item)}
                                            disabled={deletingId === item.id}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-800 text-red-400 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-40"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
