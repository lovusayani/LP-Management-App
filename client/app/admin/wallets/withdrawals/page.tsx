"use client";

import { useEffect, useMemo, useState } from "react";

import {
    AdminWithdrawRequestRecord,
    getAdminWithdrawMethods,
    getAdminWithdrawRequests,
    reviewAdminWithdrawRequest,
} from "@/services/admin.service";

const statusClass = (status: string) => {
    if (status === "approved") {
        return "bg-emerald-500/10 text-emerald-300";
    }
    if (status === "cancelled" || status === "rejected") {
        return "bg-red-500/10 text-red-300";
    }
    return "bg-amber-500/10 text-amber-300";
};

export default function AdminWalletWithdrawlsPage() {
    const [methods, setMethods] = useState<Array<{
        id: string;
        fullName: string;
        email: string;
        mainWalletBalance: number;
        walletAddress: string;
        chainType: string;
        currency: string;
        createdAt?: string;
    }>>([]);
    const [requests, setRequests] = useState<AdminWithdrawRequestRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openModifyModal, setOpenModifyModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<AdminWithdrawRequestRecord | null>(null);
    const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
    const [adminRemark, setAdminRemark] = useState("");
    const [savingReview, setSavingReview] = useState(false);

    const canModify = useMemo(
        () => selectedRequest && ["processing", "pending"].includes(selectedRequest.status),
        [selectedRequest]
    );

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [methodRows, requestRows] = await Promise.all([
                getAdminWithdrawMethods(),
                getAdminWithdrawRequests(),
            ]);
            setMethods(methodRows);
            setRequests(requestRows);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load withdrawals data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openModifyForRequest = (record: AdminWithdrawRequestRecord) => {
        setSelectedRequest(record);
        setReviewStatus("approved");
        setAdminRemark(record.adminRemark || "");
        setOpenModifyModal(true);
    };

    const onSubmitReview = async () => {
        if (!selectedRequest || !canModify) {
            return;
        }

        setSavingReview(true);
        setError("");

        try {
            await reviewAdminWithdrawRequest(
                selectedRequest.id,
                reviewStatus,
                adminRemark.trim() || undefined
            );
            await loadData();
            setOpenModifyModal(false);
            setSelectedRequest(null);
            setAdminRemark("");
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : "Failed to update withdrawal status");
        } finally {
            setSavingReview(false);
        }
    };

    return (
        <section className="card space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Withdrawals</h1>
                <p className="text-sm text-zinc-400">Manage user withdrawal methods and withdrawal requests.</p>
            </div>

            {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}

            <div className="space-y-3">
                <h2 className="text-lg font-semibold">User Withdrawal Methods</h2>
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                                <th className="px-3 py-2 text-left">User</th>
                                <th className="px-3 py-2 text-left">Address</th>
                                <th className="px-3 py-2 text-left">Chain</th>
                                <th className="px-3 py-2 text-left">Currency</th>
                                <th className="px-3 py-2 text-left">Main Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr className="border-t border-zinc-800">
                                    <td className="px-3 py-3 text-zinc-400" colSpan={5}>Loading methods...</td>
                                </tr>
                            )}
                            {!loading && methods.length === 0 && (
                                <tr className="border-t border-zinc-800">
                                    <td className="px-3 py-3 text-zinc-400" colSpan={5}>No withdrawal methods found.</td>
                                </tr>
                            )}
                            {!loading && methods.map((row) => (
                                <tr key={row.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2">
                                        <p>{row.fullName || "--"}</p>
                                        <p className="text-xs text-zinc-400">{row.email || "--"}</p>
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">{row.walletAddress || "--"}</td>
                                    <td className="px-3 py-2">{row.chainType || "--"}</td>
                                    <td className="px-3 py-2">{row.currency || "--"}</td>
                                    <td className="px-3 py-2">{Number(row.mainWalletBalance || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold">Withdrawal Requests</h2>
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                                <th className="px-3 py-2 text-left">User</th>
                                <th className="px-3 py-2 text-left">Tx ID</th>
                                <th className="px-3 py-2 text-left">Amount</th>
                                <th className="px-3 py-2 text-left">Method</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr className="border-t border-zinc-800">
                                    <td className="px-3 py-3 text-zinc-400" colSpan={6}>Loading requests...</td>
                                </tr>
                            )}
                            {!loading && requests.length === 0 && (
                                <tr className="border-t border-zinc-800">
                                    <td className="px-3 py-3 text-zinc-400" colSpan={6}>No withdrawal requests found.</td>
                                </tr>
                            )}
                            {!loading && requests.map((record) => (
                                <tr key={record.id} className="border-t border-zinc-800">
                                    <td className="px-3 py-2">
                                        <p>{record.user.fullName || "--"}</p>
                                        <p className="text-xs text-zinc-400">{record.user.email || "--"}</p>
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">{record.txId}</td>
                                    <td className="px-3 py-2">{Number(record.amount).toFixed(2)} {record.currency}</td>
                                    <td className="px-3 py-2 text-xs text-zinc-300">
                                        {record.chainType} · {record.walletAddress.slice(0, 8)}...{record.walletAddress.slice(-6)}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`rounded-md px-2 py-1 text-xs capitalize ${statusClass(record.status)}`}>
                                            {record.status === "pending" ? "processing" : record.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            className="btn-secondary px-3 py-1 text-xs"
                                            onClick={() => openModifyForRequest(record)}
                                        >
                                            Modify
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {openModifyModal && selectedRequest && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
                    <div className="card w-full max-w-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Modify Withdrawal</h2>
                            <button
                                type="button"
                                className="btn-secondary px-3 py-1"
                                onClick={() => {
                                    setOpenModifyModal(false);
                                    setSelectedRequest(null);
                                    setAdminRemark("");
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-sm">
                            <p><span className="text-zinc-400">User:</span> {selectedRequest.user.fullName || "--"}</p>
                            <p><span className="text-zinc-400">Email:</span> {selectedRequest.user.email || "--"}</p>
                            <p><span className="text-zinc-400">Tx ID:</span> {selectedRequest.txId}</p>
                            <p><span className="text-zinc-400">Amount:</span> {Number(selectedRequest.amount).toFixed(2)} {selectedRequest.currency}</p>
                            <p><span className="text-zinc-400">Chain:</span> {selectedRequest.chainType}</p>
                            <p><span className="text-zinc-400">Address:</span> {selectedRequest.walletAddress}</p>
                            <p><span className="text-zinc-400">Status:</span> {selectedRequest.status}</p>
                            <p><span className="text-zinc-400">Current Main Balance:</span> {Number(selectedRequest.user.mainWalletBalance || 0).toFixed(2)}</p>
                        </div>

                        {canModify ? (
                            <div className="space-y-3 rounded-xl border border-zinc-800 p-3">
                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Decision</label>
                                    <select
                                        className="input"
                                        value={reviewStatus}
                                        onChange={(event) => setReviewStatus(event.target.value as "approved" | "rejected")}
                                    >
                                        <option value="approved">Approve</option>
                                        <option value="rejected">Reject (cancel + restore amount)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-300">Admin Message</label>
                                    <textarea
                                        className="input min-h-[96px]"
                                        value={adminRemark}
                                        onChange={(event) => setAdminRemark(event.target.value)}
                                        maxLength={500}
                                        placeholder="Write note for user"
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary w-full"
                                    disabled={savingReview}
                                    onClick={onSubmitReview}
                                >
                                    {savingReview ? "Updating..." : reviewStatus === "approved" ? "Approve Withdrawal" : "Reject Withdrawal"}
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-300">
                                Already reviewed ({selectedRequest.status})
                                {selectedRequest.adminRemark ? ` - ${selectedRequest.adminRemark}` : ""}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
