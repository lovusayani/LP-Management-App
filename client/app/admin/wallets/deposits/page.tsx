"use client";

import { useEffect, useState } from "react";

import {
    AdminDepositeRecord,
    getAdminDepositeById,
    getAllAdminDeposites,
    reviewAdminDeposite,
} from "@/services/admin.service";

const uploadsBase = "http://localhost:5000";

export default function AdminWalletDepositesPage() {
    const [records, setRecords] = useState<AdminDepositeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openModifyModal, setOpenModifyModal] = useState(false);
    const [selectedDeposite, setSelectedDeposite] = useState<AdminDepositeRecord | null>(null);
    const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
    const [adminRemark, setAdminRemark] = useState("");
    const [savingReview, setSavingReview] = useState(false);

    const loadDeposites = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getAllAdminDeposites();
            setRecords(data);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load deposites");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeposites();
    }, []);

    const openModifyForDeposite = async (depositeId: string) => {
        setError("");

        try {
            const deposite = await getAdminDepositeById(depositeId);
            setSelectedDeposite(deposite);
            setReviewStatus("approved");
            setAdminRemark(deposite.adminRemark || "");
            setOpenModifyModal(true);
        } catch (detailError) {
            setError(detailError instanceof Error ? detailError.message : "Failed to load deposite details");
        }
    };

    const onSubmitReview = async () => {
        if (!selectedDeposite || selectedDeposite.status !== "pending") {
            return;
        }

        setSavingReview(true);
        setError("");

        try {
            await reviewAdminDeposite(selectedDeposite.id, reviewStatus, adminRemark.trim() || undefined);
            await loadDeposites();
            setOpenModifyModal(false);
            setSelectedDeposite(null);
            setAdminRemark("");
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : "Failed to update deposite status");
        } finally {
            setSavingReview(false);
        }
    };

    return (
        <section className="card space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Deposites</h1>
                <p className="text-sm text-zinc-400">Review all deposite requests and approve or reject.</p>
            </div>

            {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                            <th className="px-3 py-2 text-left">User</th>
                            <th className="px-3 py-2 text-left">Amount</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Created</th>
                            <th className="px-3 py-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr className="border-t border-zinc-800">
                                <td className="px-3 py-3 text-zinc-400" colSpan={6}>
                                    Loading deposites...
                                </td>
                            </tr>
                        )}

                        {!loading && records.length === 0 && (
                            <tr className="border-t border-zinc-800">
                                <td className="px-3 py-3 text-zinc-400" colSpan={6}>
                                    No deposite requests found.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            records.map((record) => (
                                <tr key={record.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2">
                                        <p>{record.user.fullName || "--"}</p>
                                        <p className="text-xs text-zinc-400">{record.user.email || "--"}</p>
                                    </td>
                                    <td className="px-3 py-2">{record.amount}</td>
                                    <td className="px-3 py-2">{record.depositeType}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`rounded-md px-2 py-1 text-xs ${
                                                record.status === "approved"
                                                    ? "bg-emerald-500/10 text-emerald-300"
                                                    : record.status === "rejected"
                                                        ? "bg-red-500/10 text-red-300"
                                                        : "bg-amber-500/10 text-amber-300"
                                            }`}
                                        >
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-300">
                                        {record.createdAt ? new Date(record.createdAt).toLocaleString() : "--"}
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            className="btn-secondary px-3 py-1 text-xs"
                                            onClick={() => openModifyForDeposite(record.id)}
                                        >
                                            Modify
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {openModifyModal && selectedDeposite && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                    <div className="card w-full max-w-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Deposite Details</h2>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1"
                                onClick={() => {
                                    setOpenModifyModal(false);
                                    setSelectedDeposite(null);
                                    setAdminRemark("");
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <p><span className="text-zinc-400">User:</span> {selectedDeposite.user.fullName || "--"}</p>
                            <p><span className="text-zinc-400">Email:</span> {selectedDeposite.user.email || "--"}</p>
                            <p><span className="text-zinc-400">Amount:</span> {selectedDeposite.amount}</p>
                            <p><span className="text-zinc-400">Type:</span> {selectedDeposite.depositeType}</p>
                            <p><span className="text-zinc-400">Network:</span> {selectedDeposite.network || "--"}</p>
                            <p><span className="text-zinc-400">Wallet:</span> {selectedDeposite.walletAddress || "--"}</p>
                            <p>
                                <span className="text-zinc-400">Main Wallet Balance:</span>{" "}
                                {selectedDeposite.user.mainWalletBalance ?? 0}
                            </p>
                            <p><span className="text-zinc-400">Status:</span> {selectedDeposite.status}</p>
                        </div>

                        <div>
                            <p className="mb-1 text-sm text-zinc-400">User Remark</p>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm">
                                {selectedDeposite.remarks || "--"}
                            </div>
                        </div>

                        {selectedDeposite.screenshot && (
                            <div>
                                <p className="mb-1 text-sm text-zinc-400">Payment Screenshot</p>
                                <a
                                    href={`${uploadsBase}${selectedDeposite.screenshot}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-cyan-300 underline"
                                >
                                    Open uploaded screenshot
                                </a>
                            </div>
                        )}

                        {selectedDeposite.status === "pending" ? (
                            <div className="space-y-3 rounded-xl border border-zinc-800 p-3">
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Decision</label>
                                    <select
                                        className="input"
                                        value={reviewStatus}
                                        onChange={(event) => setReviewStatus(event.target.value as "approved" | "rejected")}
                                    >
                                        <option value="approved">Approve</option>
                                        <option value="rejected">Reject</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Admin Remark (optional)</label>
                                    <textarea
                                        className="input min-h-[96px]"
                                        value={adminRemark}
                                        onChange={(event) => setAdminRemark(event.target.value)}
                                        maxLength={500}
                                        placeholder="Write reason or note"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary w-full"
                                    disabled={savingReview}
                                    onClick={onSubmitReview}
                                >
                                    {savingReview ? "Updating..." : reviewStatus === "approved" ? "Approve Deposite" : "Reject Deposite"}
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-300">
                                Already reviewed ({selectedDeposite.status})
                                {selectedDeposite.adminRemark ? ` - ${selectedDeposite.adminRemark}` : ""}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
