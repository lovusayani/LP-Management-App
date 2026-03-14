"use client";

import { useEffect, useState } from "react";

import { TopbarPageFrame } from "@/components/dashboard/TopbarPageFrame";
import { getPageContent } from "@/services/user.service";

interface FaqItem { q: string; a: string; }

const parseFaq = (raw: string): FaqItem[] => {
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch { }
    return [];
};

export default function FaqPage() {
    const [title, setTitle] = useState("FAQ");
    const [items, setItems] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    useEffect(() => {
        getPageContent("faq").then((data) => {
            setTitle(data.title || "FAQ");
            setItems(parseFaq(data.content));
        }).finally(() => setLoading(false));
    }, []);

    return (
        <TopbarPageFrame title={title}>
            <h1 className="text-xl font-semibold">{title}</h1>
            {loading ? (
                <p className="text-sm text-zinc-400">Loading...</p>
            ) : items.length === 0 ? (
                <p className="text-sm text-zinc-400">No FAQ entries yet.</p>
            ) : (
                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="rounded-xl border border-zinc-800 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-zinc-100 hover:bg-zinc-800/50"
                            >
                                <span>{item.q}</span>
                                <span className="text-zinc-500 text-lg leading-none">
                                    {openIdx === i ? "−" : "+"}
                                </span>
                            </button>
                            {openIdx === i && (
                                <div className="border-t border-zinc-800 px-4 py-3">
                                    <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </TopbarPageFrame>
    );
}
