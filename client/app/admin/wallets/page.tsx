"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLpUser, adjustAdminLpMainBalance, getAllLpUsers } from "@/services/admin.service";

const PAGE_SIZE = 10;

const formatMoney = (value: number | undefined) => Number(value || 0).toFixed(2);

const CREDIT_CATEGORIES = ["Bonus", "Referrals", "Adjustment", "Promotion", "Manual Credit"];
const DEBIT_CATEGORIES = ["Tax", "Transfer Fees", "Penalty", "Service Charge", "Manual Deduction"];

type BalanceAction = "credit" | "debit";

export default function AdminWalletsPage() {
    const [users, setUsers] = useState<AdminLpUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedUser, setSelectedUser] = useState<AdminLpUser | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState<BalanceAction>("credit");
    const [category, setCategory] = useState(CREDIT_CATEGORIES[0]);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const loadUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAllLpUsers();
            setUsers(data);
            setCurrentPage(1);
        } catch {
            setError("Failed to load wallet users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    const paginatedUsers = useMemo(
        () => users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [users, currentPage]
    );

    const activeCategories = useMemo(
        () => (actionType === "credit" ? CREDIT_CATEGORIES : DEBIT_CATEGORIES),
        [actionType]
    );

    useEffect(() => {
        setCategory(activeCategories[0]);
    }, [activeCategories]);

    const openModal = (user: AdminLpUser) => {
        setSelectedUser(user);
        setActionType("credit");
        setCategory(CREDIT_CATEGORIES[0]);
        setAmount("");
        setNote("");
        setSuccessMessage("");
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setSubmitting(false);
    };

    const onSubmit = async () => {
        if (!selectedUser) return;

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError("Enter a valid amount greater than 0.");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await adjustAdminLpMainBalance(selectedUser.id, {
                action: actionType,
                amount: parsedAmount,
                category,
                note: note.trim() || undefined,
            });

            setUsers((prev) =>
                prev.map((user) =>
                    user.id === selectedUser.id
                        ? { ...user, mainWalletBalance: Number(response.user.mainWalletBalance || 0) }
                        : user
                )
            );

            setSuccessMessage(response.message);
            setAmount("");
            setNote("");
        } catch {
            setError("Unable to update main balance. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Wallets</h1>
                    <p className="mt-1 text-sm text-zinc-400">User-wise wallet balances and manual adjustments.</p>
                </div>
                <button
                    type="button"
                    className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                    onClick={loadUsers}
                >
                    Refresh
                </button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                            <th className="px-3 py-2 text-left">Name</th>
                            <th className="px-3 py-2 text-left">Main Bal</th>
                            <th className="px-3 py-2 text-left">Trade Bal</th>
                            <th className="px-3 py-2 text-left">User ID (_id)</th>
                            <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="border-t border-zinc-800">
                                <td colSpan={5} className="px-3 py-4 text-zinc-400">Loading users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr className="border-t border-zinc-800">
                                <td colSpan={5} className="px-3 py-4 text-zinc-400">No LP users found.</td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user) => (
                                <tr key={user.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2">{user.fullName}</td>
                                    <td className="px-3 py-2">{formatMoney(user.mainWalletBalance)}</td>
                                    <td className="px-3 py-2">{formatMoney(user.tradeWalletBalance)}</td>
                                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">{user.id}</td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                                            onClick={() => openModal(user)}
                                        >
                                            Action
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && users.length > 0 && (
                <div className="flex items-center justify-between gap-3 pt-1 text-sm text-zinc-400">
                    <span>
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, users.length)} of {users.length} users
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-md border px-3 py-1 text-xs ${page === currentPage
                                        ? "border-emerald-700 bg-emerald-700/20 text-emerald-300"
                                        : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {showModal && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-5">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">Adjust Main Balance</h2>
                                <p className="mt-1 text-sm text-zinc-400">
                                    {selectedUser.fullName} ({selectedUser.id})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-300">Type</span>
                                <select
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value as BalanceAction)}
                                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                                >
                                    <option value="credit">Deposit / Add Main Balance</option>
                                    <option value="debit">Deduct Main Balance</option>
                                </select>
                            </label>

                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-300">Category</span>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                                >
                                    {activeCategories.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-300">Amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                                />
                            </label>

                            <label className="grid gap-1 text-sm">
                                <span className="text-zinc-300">Note (optional)</span>
                                <textarea
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Reason or reference"
                                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
                                />
                            </label>
                        </div>

                        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                        {successMessage && <p className="mt-3 text-sm text-emerald-400">{successMessage}</p>}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onSubmit}
                                className="rounded-md border border-emerald-700 bg-emerald-700/20 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={submitting}
                            >
                                {submitting ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
