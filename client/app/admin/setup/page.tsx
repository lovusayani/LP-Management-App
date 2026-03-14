"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { BrandingAssets, BrandingLogoVariant, getBrandingAssets, uploadAdminBrandingLogo } from "@/services/branding.service";
import { getPublicAssetUrl } from "@/services/api";

const LOGO_SPECS: Array<{
    variant: BrandingLogoVariant;
    title: string;
    sizeLabel: string;
    helper: string;
}> = [
        {
            variant: "dark",
            title: "Dark Logo",
            sizeLabel: "270x74 PNG",
            helper: "Use this on light surfaces.",
        },
        {
            variant: "light",
            title: "Light Logo",
            sizeLabel: "270x74 PNG",
            helper: "Used on admin dark topbar and admin login.",
        },
        {
            variant: "mobile",
            title: "Mobile Logo",
            sizeLabel: "180x62 PNG",
            helper: "Used above the frontend login form.",
        },
    ];

export default function AdminSetupPage() {
    const [branding, setBranding] = useState<BrandingAssets>({
        darkLogoPath: "",
        lightLogoPath: "",
        mobileLogoPath: "",
    });
    const [files, setFiles] = useState<Partial<Record<BrandingLogoVariant, File | null>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Partial<Record<BrandingLogoVariant, boolean>>>({});
    const [messages, setMessages] = useState<Partial<Record<BrandingLogoVariant, string>>>({});

    useEffect(() => {
        let disposed = false;

        const load = async () => {
            try {
                const data = await getBrandingAssets();
                if (!disposed) {
                    setBranding(data);
                }
            } finally {
                if (!disposed) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            disposed = true;
        };
    }, []);

    const onFileChange = (variant: BrandingLogoVariant, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setFiles((prev) => ({ ...prev, [variant]: file }));
        setMessages((prev) => ({ ...prev, [variant]: "" }));
    };

    const onUpload = async (variant: BrandingLogoVariant) => {
        const file = files[variant];
        if (!file) {
            setMessages((prev) => ({ ...prev, [variant]: "Please choose a PNG file first." }));
            return;
        }

        setSaving((prev) => ({ ...prev, [variant]: true }));
        setMessages((prev) => ({ ...prev, [variant]: "Uploading..." }));
        try {
            const nextBranding = await uploadAdminBrandingLogo(variant, file);
            setBranding(nextBranding);
            setFiles((prev) => ({ ...prev, [variant]: null }));
            setMessages((prev) => ({ ...prev, [variant]: "Logo uploaded successfully." }));
            window.dispatchEvent(new Event("branding-updated"));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
            setMessages((prev) => ({ ...prev, [variant]: message }));
        } finally {
            setSaving((prev) => ({ ...prev, [variant]: false }));
        }
    };

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Setup</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Upload and manage the branding logos used in admin and frontend login screens.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {LOGO_SPECS.map((item) => {
                    const currentPath = branding[
                        item.variant === "dark"
                            ? "darkLogoPath"
                            : item.variant === "light"
                                ? "lightLogoPath"
                                : "mobileLogoPath"
                    ];

                    return (
                        <div key={item.variant} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{item.sizeLabel}</p>
                                </div>
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                                    PNG
                                </span>
                            </div>

                            <div className="mb-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-4">
                                <div className="flex min-h-[110px] items-center justify-center rounded-xl bg-zinc-900/80 px-4">
                                    {currentPath ? (
                                        <img
                                            src={getPublicAssetUrl(currentPath)}
                                            alt={item.title}
                                            className="max-h-[74px] w-auto max-w-full object-contain"
                                        />
                                    ) : (
                                        <BrandLogo
                                            variant={item.variant}
                                            fallbackText="No logo uploaded"
                                            className="max-h-[74px] w-auto max-w-full object-contain"
                                            wrapperClassName="text-sm text-zinc-500"
                                        />
                                    )}
                                </div>
                            </div>

                            <p className="mb-4 text-sm text-zinc-400">{item.helper}</p>

                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept="image/png,.png"
                                    onChange={(event) => onFileChange(item.variant, event)}
                                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => onUpload(item.variant)}
                                    disabled={Boolean(saving[item.variant]) || loading}
                                    className="w-full rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving[item.variant] ? "Uploading..." : `Upload ${item.title}`}
                                </button>
                                {messages[item.variant] && (
                                    <p className={`text-sm ${messages[item.variant]?.toLowerCase().includes("success") ? "text-emerald-400" : messages[item.variant] === "Uploading..." ? "text-zinc-400" : "text-red-400"}`}>
                                        {messages[item.variant]}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
