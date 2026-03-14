"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    BookOpen,
    HelpCircle,
    Info,
    Loader2,
    MessageSquare,
    Plus,
    Save,
    Trash2,
} from "lucide-react";

import {
    PageContentRecord,
    PageSlug,
    getAdminPageContent,
    updateAdminPageContent,
} from "@/services/admin.service";

// ── FAQ item shape ────────────────────────────────────────────────────────────
interface FaqItem {
    q: string;
    a: string;
}

const parseFaq = (raw: string): FaqItem[] => {
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch { }
    return [{ q: "", a: "" }];
};

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { slug: PageSlug; label: string; icon: React.ReactNode; desc: string }[] = [
    {
        slug: "about",
        label: "About",
        icon: <Info className="h-4 w-4" />,
        desc: "Shown on the frontend About page",
    },
    {
        slug: "help",
        label: "Help",
        icon: <HelpCircle className="h-4 w-4" />,
        desc: "Shown on the frontend Help page",
    },
    {
        slug: "support",
        label: "Support",
        icon: <MessageSquare className="h-4 w-4" />,
        desc: "Shown on the frontend Support page",
    },
    {
        slug: "faq",
        label: "FAQ",
        icon: <BookOpen className="h-4 w-4" />,
        desc: "Shown on the frontend FAQ page (Q&A list)",
    },
];

// ── Text editor tab ───────────────────────────────────────────────────────────
function TextEditor({
    slug,
    initial,
    onSaved,
}: {
    slug: PageSlug;
    initial: PageContentRecord | null;
    onSaved: (p: PageContentRecord) => void;
}) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [content, setContent] = useState(initial?.content ?? "");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    useEffect(() => {
        setTitle(initial?.title ?? "");
        setContent(initial?.content ?? "");
        setMsg(null);
    }, [initial]);

    const save = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const saved = await updateAdminPageContent(slug, { title: title.trim() || slug, content });
            onSaved(saved);
            setMsg({ type: "ok", text: "Saved successfully." });
        } catch {
            setMsg({ type: "err", text: "Failed to save. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-400">Page Title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. About Us"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
                />
            </div>
            <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-400">Page Content</label>
                <textarea
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write the page content here..."
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 resize-y"
                />
                <p className="text-xs text-zinc-600">
                    Supports plain text. Separate paragraphs with empty lines.
                </p>
            </div>
            {msg && (
                <p className={`text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                    {msg.text}
                </p>
            )}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 px-5 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}

// ── FAQ editor tab ────────────────────────────────────────────────────────────
function FaqEditor({
    initial,
    onSaved,
}: {
    initial: PageContentRecord | null;
    onSaved: (p: PageContentRecord) => void;
}) {
    const [title, setTitle] = useState(initial?.title ?? "FAQ");
    const [items, setItems] = useState<FaqItem[]>(() => parseFaq(initial?.content ?? "[]"));
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    useEffect(() => {
        setTitle(initial?.title ?? "FAQ");
        setItems(parseFaq(initial?.content ?? "[]"));
        setMsg(null);
    }, [initial]);

    const addRow = () => setItems((prev) => [...prev, { q: "", a: "" }]);
    const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
    const update = (i: number, field: "q" | "a", value: string) =>
        setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

    const save = async () => {
        const cleaned = items.filter((it) => it.q.trim() || it.a.trim());
        setSaving(true);
        setMsg(null);
        try {
            const saved = await updateAdminPageContent("faq", {
                title: title.trim() || "FAQ",
                content: JSON.stringify(cleaned),
            });
            onSaved(saved);
            setMsg({ type: "ok", text: "FAQ saved successfully." });
        } catch {
            setMsg({ type: "err", text: "Failed to save FAQ." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-1">
                <label className="text-xs font-medium text-zinc-400">Page Title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="FAQ"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
                />
            </div>

            <div className="space-y-3">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="relative rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
                    >
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                                {i + 1}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="ml-auto rounded-lg border border-red-500/20 p-1 text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs text-zinc-500">Question</label>
                            <input
                                value={item.q}
                                onChange={(e) => update(i, "q", e.target.value)}
                                placeholder="Enter question..."
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/40"
                            />
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs text-zinc-500">Answer</label>
                            <textarea
                                rows={3}
                                value={item.a}
                                onChange={(e) => update(i, "a", e.target.value)}
                                placeholder="Enter answer..."
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/40 resize-y"
                            />
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addRow}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-2.5 text-sm text-zinc-400 transition hover:border-violet-500/40 hover:text-violet-300"
                >
                    <Plus className="h-4 w-4" />
                    Add Question
                </button>
            </div>

            {msg && (
                <p className={`text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                    {msg.text}
                </p>
            )}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 px-5 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save FAQ"}
                </button>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PageSetupPage() {
    const [activeSlug, setActiveSlug] = useState<PageSlug>("about");
    const [pages, setPages] = useState<Record<PageSlug, PageContentRecord | null>>({
        about: null,
        help: null,
        support: null,
        faq: null,
    });
    const [loading, setLoading] = useState<Partial<Record<PageSlug, boolean>>>({});
    const [loadError, setLoadError] = useState<Partial<Record<PageSlug, string>>>({});
    const loadedRef = useRef<Set<PageSlug>>(new Set());

    const loadSlug = useCallback(async (slug: PageSlug) => {
        if (loadedRef.current.has(slug)) return;
        loadedRef.current.add(slug);
        setLoading((p) => ({ ...p, [slug]: true }));
        setLoadError((p) => ({ ...p, [slug]: "" }));
        try {
            const data = await getAdminPageContent(slug);
            setPages((p) => ({ ...p, [slug]: data }));
        } catch {
            loadedRef.current.delete(slug);
            setLoadError((p) => ({ ...p, [slug]: "Failed to load. Click Retry." }));
        } finally {
            setLoading((p) => ({ ...p, [slug]: false }));
        }
    }, []);

    useEffect(() => {
        loadSlug("about");
    }, [loadSlug]);

    const onTabChange = (slug: PageSlug) => {
        setActiveSlug(slug);
        loadSlug(slug);
    };

    const onSaved = (slug: PageSlug) => (record: PageContentRecord) => {
        setPages((p) => ({ ...p, [slug]: record }));
    };

    const activeTab = TABS.find((t) => t.slug === activeSlug)!;
    const isLoading = loading[activeSlug];
    const hasError = loadError[activeSlug];

    return (
        <section className="space-y-5">
            {/* header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Page Setup</h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Manage content displayed on the LP dashboard pages.
                </p>
            </div>

            {/* tab strip */}
            <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => {
                    const active = tab.slug === activeSlug;
                    return (
                        <button
                            key={tab.slug}
                            type="button"
                            onClick={() => onTabChange(tab.slug)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${active
                                    ? "border border-violet-500/50 bg-violet-600/20 text-violet-200 shadow-lg shadow-violet-900/30"
                                    : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* editor card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
                <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/20 text-violet-300">
                        {activeTab.icon}
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white">{activeTab.label}</h2>
                        <p className="text-xs text-zinc-500">{activeTab.desc}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-2 py-8 text-zinc-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Loading content...</span>
                    </div>
                ) : hasError ? (
                    <div className="space-y-3 py-6 text-center">
                        <p className="text-sm text-red-400">{hasError}</p>
                        <button
                            type="button"
                            onClick={() => {
                                loadedRef.current.delete(activeSlug);
                                loadSlug(activeSlug);
                            }}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                        >
                            Retry
                        </button>
                    </div>
                ) : activeSlug === "faq" ? (
                    <FaqEditor initial={pages.faq} onSaved={onSaved("faq")} />
                ) : (
                    <TextEditor slug={activeSlug} initial={pages[activeSlug]} onSaved={onSaved(activeSlug)} />
                )}
            </div>
        </section>
    );
}
