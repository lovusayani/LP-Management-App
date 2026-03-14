"use client";

import { FormEvent, useEffect, useState } from "react";

import {
    AdminLpUser,
    createLpUser,
    getAllLpUsers,
    updateLpUserLockInBalance,
    updateLpUserKycStatus,
    updateLpUserPassword,
    updateLpUserStatus,
} from "@/services/admin.service";

type NewLpForm = {
    fullName: string;
    email: string;
    phone: string;
    password: string;
};

const defaultForm: NewLpForm = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
};

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminLpUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [openModifyModal, setOpenModifyModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminLpUser | null>(null);
    const [openKycPreview, setOpenKycPreview] = useState(false);
    const [previewUser, setPreviewUser] = useState<AdminLpUser | null>(null);
    const [form, setForm] = useState<NewLpForm>(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [savingModify, setSavingModify] = useState(false);
    const [statusForm, setStatusForm] = useState<"active" | "inactive">("active");
    const [kycForm, setKycForm] = useState<"approved" | "rejected" | "pending">("pending");
    const [newPassword, setNewPassword] = useState("");
    const [lockInBalanceForm, setLockInBalanceForm] = useState("500");
    const [usersPage, setUsersPage] = useState(1);
    const [kycPage, setKycPage] = useState(1);

    const uploadsBase = "http://localhost:5000";

    const loadUsers = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getAllLpUsers();
            setUsers(data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const onCreateUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const created = await createLpUser({
                fullName: form.fullName,
                email: form.email,
                phone: form.phone || undefined,
                password: form.password,
            });

            setUsers((prev) => [created, ...prev]);
            setForm(defaultForm);
            setOpenModal(false);
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Failed to create LP user");
        } finally {
            setSubmitting(false);
        }
    };

    const openModifyForUser = (user: AdminLpUser) => {
        setSelectedUser(user);
        setStatusForm(user.status === "active" ? "active" : "inactive");
        setKycForm(user.kycStatus === "not_submitted" ? "pending" : user.kycStatus);
        setNewPassword("");
        setLockInBalanceForm(String(user.lockInBalance ?? 500));
        setOpenModifyModal(true);
    };

    const onModifyUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedUser) {
            return;
        }

        setSavingModify(true);
        setError("");

        try {
            await updateLpUserStatus(selectedUser.id, statusForm === "active" ? "active" : "suspended");
            await updateLpUserKycStatus(selectedUser.id, kycForm);

            if (newPassword.trim()) {
                await updateLpUserPassword(selectedUser.id, newPassword.trim());
            }

            await updateLpUserLockInBalance(selectedUser.id, Number(lockInBalanceForm || 0));

            await loadUsers();
            setOpenModifyModal(false);
            setSelectedUser(null);
        } catch (modifyError) {
            setError(modifyError instanceof Error ? modifyError.message : "Failed to modify user");
        } finally {
            setSavingModify(false);
        }
    };

    const onQuickKycUpdate = async (userId: string, kycStatus: "approved" | "rejected") => {
        setError("");
        try {
            await updateLpUserKycStatus(userId, kycStatus);
            await loadUsers();
        } catch (kycError) {
            setError(kycError instanceof Error ? kycError.message : "Failed to update KYC status");
        }
    };

    const usersWithDocuments = users.filter((user) => {
        const docs = user.kycDocuments;
        return Boolean(docs?.companyProof || docs?.panCard || docs?.aadhaarCard || docs?.selfie);
    });

    const totalUsersPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const totalKycPages = Math.max(1, Math.ceil(usersWithDocuments.length / PAGE_SIZE));

    const paginatedUsers = users.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);
    const paginatedKycUsers = usersWithDocuments.slice((kycPage - 1) * PAGE_SIZE, kycPage * PAGE_SIZE);

    useEffect(() => {
        if (usersPage > totalUsersPages) {
            setUsersPage(totalUsersPages);
        }
    }, [totalUsersPages, usersPage]);

    useEffect(() => {
        if (kycPage > totalKycPages) {
            setKycPage(totalKycPages);
        }
    }, [kycPage, totalKycPages]);

    return (
        <section className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Users</h1>
                    <p className="text-sm text-zinc-400">All LP users</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => setOpenModal(true)}>
                    Add New User / LP
                </button>
            </div>

            {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">Phone</th>
                            <th className="px-3 py-2 text-left">Lock In</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">KYC</th>
                            <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr className="border-t border-zinc-800">
                                <td className="px-3 py-3 text-zinc-400" colSpan={7}>
                                    Loading users...
                                </td>
                            </tr>
                        )}

                        {!loading && users.length === 0 && (
                            <tr className="border-t border-zinc-800">
                                <td className="px-3 py-3 text-zinc-400" colSpan={7}>
                                    No LP users yet.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            paginatedUsers.map((user) => (
                                <tr key={user.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2">{user.fullName}</td>
                                    <td className="px-3 py-2">{user.email}</td>
                                    <td className="px-3 py-2">{user.phone || "--"}</td>
                                    <td className="px-3 py-2">{Number(user.lockInBalance ?? 500).toFixed(2)}</td>
                                    <td className="px-3 py-2">{user.status}</td>
                                    <td className="px-3 py-2">{user.kycStatus}</td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            className="btn-secondary px-3 py-1 text-xs"
                                            onClick={() => openModifyForUser(user)}
                                        >
                                            Modify
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="btn-secondary px-3 py-1 text-xs"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                >
                    Prev
                </button>
                <span className="text-xs text-zinc-400">
                    Page {usersPage} of {totalUsersPages}
                </span>
                <button
                    type="button"
                    className="btn-secondary px-3 py-1 text-xs"
                    disabled={usersPage >= totalUsersPages}
                    onClick={() => setUsersPage((prev) => Math.min(totalUsersPages, prev + 1))}
                >
                    Next
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-sm">
                    <caption className="caption-top px-3 py-2 text-left text-sm text-zinc-400">
                        KYC Documents Review
                    </caption>
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                            <th className="px-3 py-2 text-left">User</th>
                            <th className="px-3 py-2 text-left">KYC Status</th>
                            <th className="px-3 py-2 text-left">Documents</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersWithDocuments.length === 0 && (
                            <tr className="border-t border-zinc-800">
                                <td className="px-3 py-3 text-zinc-400" colSpan={3}>
                                    No KYC documents submitted yet.
                                </td>
                            </tr>
                        )}

                        {paginatedKycUsers.map((user) => (
                            <tr key={`kyc-${user.id}`} className="border-t border-zinc-800">
                                <td className="px-3 py-2">{user.fullName}</td>
                                <td className="px-3 py-2">{user.kycStatus}</td>
                                <td className="px-3 py-2">
                                    <button
                                        type="button"
                                        className="btn-secondary px-3 py-1 text-xs"
                                        onClick={() => {
                                            setPreviewUser(user);
                                            setOpenKycPreview(true);
                                        }}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="btn-secondary px-3 py-1 text-xs"
                    disabled={kycPage <= 1}
                    onClick={() => setKycPage((prev) => Math.max(1, prev - 1))}
                >
                    Prev
                </button>
                <span className="text-xs text-zinc-400">
                    Page {kycPage} of {totalKycPages}
                </span>
                <button
                    type="button"
                    className="btn-secondary px-3 py-1 text-xs"
                    disabled={kycPage >= totalKycPages}
                    onClick={() => setKycPage((prev) => Math.min(totalKycPages, prev + 1))}
                >
                    Next
                </button>
            </div>

            {openModal && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                    <div className="card w-full max-w-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Add New User / LP</h2>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1"
                                onClick={() => {
                                    setOpenModal(false);
                                    setForm(defaultForm);
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <form className="space-y-3" onSubmit={onCreateUser}>
                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Full Name</label>
                                <input
                                    className="input"
                                    value={form.fullName}
                                    onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Phone (optional)</label>
                                <input
                                    className="input"
                                    value={form.phone}
                                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    minLength={8}
                                    value={form.password}
                                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                                    required
                                />
                            </div>

                            <button disabled={submitting} className="btn-primary w-full">
                                {submitting ? "Creating..." : "Create LP User"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {openModifyModal && selectedUser && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                    <div className="card w-full max-w-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Modify User</h2>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1"
                                onClick={() => {
                                    setOpenModifyModal(false);
                                    setSelectedUser(null);
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <form className="space-y-3" onSubmit={onModifyUser}>
                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">User</label>
                                <input className="input" value={`${selectedUser.fullName} (${selectedUser.email})`} disabled />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Status</label>
                                <select
                                    className="input"
                                    value={statusForm}
                                    onChange={(event) => setStatusForm(event.target.value as "active" | "inactive")}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">KYC Status</label>
                                <select
                                    className="input"
                                    value={kycForm}
                                    onChange={(event) =>
                                        setKycForm(event.target.value as "approved" | "rejected" | "pending")
                                    }
                                >
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">New Password (optional)</label>
                                <input
                                    className="input"
                                    type="password"
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    placeholder="Leave blank if no change"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-300">Lock In Balance</label>
                                <input
                                    className="input"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={lockInBalanceForm}
                                    onChange={(event) => setLockInBalanceForm(event.target.value)}
                                />
                            </div>

                            <button disabled={savingModify} className="btn-primary w-full">
                                {savingModify ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {openKycPreview && previewUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
                    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">KYC Documents - {previewUser.fullName}</h3>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1"
                                onClick={() => {
                                    setOpenKycPreview(false);
                                    setPreviewUser(null);
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {[
                                { key: "companyProof", label: "Company Proof" },
                                { key: "panCard", label: "PAN Card" },
                                { key: "aadhaarCard", label: "Aadhaar Card" },
                                { key: "selfie", label: "Selfie" },
                            ].map((doc) => {
                                const filePath = previewUser.kycDocuments?.[doc.key as keyof NonNullable<AdminLpUser["kycDocuments"]>];
                                const fileUrl = filePath ? `${uploadsBase}/${filePath}` : "";

                                return (
                                    <div key={doc.key} className="rounded-xl border border-zinc-800 p-3">
                                        <p className="mb-2 text-sm font-medium text-zinc-200">{doc.label}</p>
                                        {!filePath && <p className="text-sm text-zinc-500">No document</p>}
                                        {filePath && (
                                            <div className="space-y-3">
                                                <div className="mx-auto h-[230px] w-[320px] max-w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                                                    <img
                                                        src={fileUrl}
                                                        alt={doc.label}
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-secondary inline-block px-3 py-1 text-xs"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={async () => {
                                    await onQuickKycUpdate(previewUser.id, "approved");
                                    setOpenKycPreview(false);
                                    setPreviewUser(null);
                                }}
                            >
                                Approve
                            </button>
                            <button
                                type="button"
                                className="btn-secondary border-red-700 text-red-300 hover:bg-red-900/20"
                                onClick={async () => {
                                    await onQuickKycUpdate(previewUser.id, "rejected");
                                    setOpenKycPreview(false);
                                    setPreviewUser(null);
                                }}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
