"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import { downloadPnlFile, getUserPnlUploads, UserPnlUploadRecord } from "@/services/user.service";

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

export default function ProfileReportsPage() {
    const [reports, setReports] = useState<UserPnlUploadRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useLayoutEffect(() => {
        const updateWidth = () => {
            setDeviceWidth(window.innerWidth || document.documentElement.clientWidth || 360);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getUserPnlUploads();
            setReports(data);
        } catch {
            setError("Failed to load reports.");
        } finally {
            setLoading(false);
        }
    }, []);

    const totalSize = useMemo(
        () => reports.reduce((sum, report) => sum + Number(report.fileSize || 0), 0),
        [reports]
    );

    const onDownload = async (report: UserPnlUploadRecord) => {
        if (downloadingId) return;
        setDownloadingId(report.id);
        setError("");
        try {
            await downloadPnlFile(report.id, report.originalName);
        } catch {
            setError(`Failed to download "${report.originalName}". Please try again.`);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="min-h-screen w-full pb-28">
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                <div
                    className="pointer-events-auto mx-auto"
                    style={deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined}
                >
                    <DashboardTopbar title="Reports" showBack />
                </div>
            </div>

            <section className="card mt-24 space-y-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Reports</h1>
                        <p className="text-sm text-zinc-400">Click reload to fetch reports, then click any row to download.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-zinc-400">
                            <p>Files: {reports.length}</p>
                            <p>Total: {formatBytes(totalSize)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => loadReports()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                                <th className="px-3 py-2 text-left">PDF Name</th>
                                <th className="px-3 py-2 text-left">Upload Date</th>
                                <th className="px-3 py-2 text-left">Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="border-t border-zinc-800">
                                    <td colSpan={3} className="px-3 py-4 text-zinc-400">Loading...</td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr className="border-t border-zinc-800">
                                    <td colSpan={3} className="px-3 py-4 text-zinc-400">
                                        No PDF reports available.
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="cursor-pointer border-t border-zinc-800 transition-colors hover:bg-zinc-800/50"
                                        onClick={() => onDownload(report)}
                                        title={`Click to download ${report.originalName}`}
                                    >
                                        <td className="px-3 py-2">{report.originalName}</td>
                                        <td className="px-3 py-2 text-zinc-300">
                                            {report.uploadedAt ? new Date(report.uploadedAt).toLocaleString() : "--"}
                                        </td>
                                        <td className="px-3 py-2">{formatBytes(report.fileSize)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
