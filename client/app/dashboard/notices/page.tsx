"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { TopbarPageFrame } from "@/components/dashboard/TopbarPageFrame";
import { getMyNoticeById, getMyNotices, NoticeListItem } from "@/services/user.service";

export default function NoticesPage() {
    const [notices, setNotices] = useState<NoticeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<NoticeListItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        getMyNotices()
            .then(setNotices)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load notices"))
            .finally(() => setLoading(false));
    }, []);

    const onOpenNotice = async (notice: NoticeListItem) => {
        setDetailLoading(true);
        setError("");
        try {
            const full = await getMyNoticeById(notice.id);
            setSelected(full);
            setNotices((prev) => prev.map((item) => (item.id === full.id ? { ...item, read: true } : item)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load notice");
        } finally {
            setDetailLoading(false);
        }
    };

    if (selected) {
        return (
            <TopbarPageFrame title="Notice">
                <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
                >
                    <ChevronLeft className="h-4 w-4" /> Back to notices
                </button>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <h1 className="text-lg font-semibold text-white">{selected.title}</h1>
                    <p className="mt-1 text-xs text-zinc-500">
                        {new Date(selected.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                        {selected.message}
                    </p>
                </div>
            </TopbarPageFrame>
        );
    }

    return (
        <TopbarPageFrame title="Notices">
            <h1 className="text-xl font-semibold">Notices</h1>

            {loading ? (
                <p className="text-sm text-zinc-400">Loading...</p>
            ) : error ? (
                <p className="text-sm text-red-400">{error}</p>
            ) : notices.length === 0 ? (
                <p className="text-sm text-zinc-400">No notices yet.</p>
            ) : (
                <div className="space-y-2">
                    {notices.map((notice) => (
                        <button
                            key={notice.id}
                            type="button"
                            onClick={() => onOpenNotice(notice)}
                            disabled={detailLoading}
                            className="flex w-full items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {!notice.read && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
                                    <span className={`truncate text-sm ${notice.read ? "text-zinc-300" : "font-semibold text-white"}`}>
                                        {notice.title}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-xs text-zinc-500">{notice.message}</p>
                            </div>
                            <span className="shrink-0 text-xs text-zinc-500">
                                {new Date(notice.createdAt).toLocaleDateString()}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </TopbarPageFrame>
    );
}
