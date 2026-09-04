"use client";

import { ChangeEvent, useEffect, useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { BrandingAssets, BrandingLogoVariant, getBrandingAssets, uploadAdminBrandingLogo } from "@/services/branding.service";
import { getPublicAssetUrl } from "@/services/api";
import {
    DataTableInfo,
    exportDataTables,
    getDataTables,
    resetDataTables,
} from "@/services/dataManagement.service";

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

    const [dataTables, setDataTables] = useState<DataTableInfo[]>([]);
    const [tablesLoading, setTablesLoading] = useState(true);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);
    const [dataMessage, setDataMessage] = useState("");
    const [dataError, setDataError] = useState("");
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState("");
    const [resetting, setResetting] = useState(false);

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

    const loadDataTables = async () => {
        setTablesLoading(true);
        try {
            const tables = await getDataTables();
            setDataTables(tables);
        } catch (error) {
            setDataError(error instanceof Error ? error.message : "Failed to load tables.");
        } finally {
            setTablesLoading(false);
        }
    };

    useEffect(() => {
        loadDataTables();
    }, []);

    const toggleTable = (key: string) => {
        setSelectedTables((prev) =>
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        );
    };

    const toggleAllTables = () => {
        setSelectedTables((prev) =>
            prev.length === dataTables.length ? [] : dataTables.map((table) => table.key)
        );
    };

    const onExport = async () => {
        setExporting(true);
        setDataMessage("");
        setDataError("");
        try {
            await exportDataTables(selectedTables);
            setDataMessage(
                selectedTables.length === 0
                    ? "All tables exported successfully."
                    : `${selectedTables.length} table(s) exported successfully.`
            );
        } catch (error) {
            setDataError(error instanceof Error ? error.message : "Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const onConfirmReset = async () => {
        if (resetConfirmText !== "RESET") {
            return;
        }

        setResetting(true);
        setDataMessage("");
        setDataError("");
        try {
            const results = await resetDataTables(selectedTables, resetConfirmText);
            const totalDeleted = results.reduce((sum, item) => sum + item.deletedCount, 0);
            setDataMessage(`Reset complete. ${totalDeleted} record(s) removed across ${results.length} table(s).`);
            setResetModalOpen(false);
            setResetConfirmText("");
            setSelectedTables([]);
            await loadDataTables();
        } catch (error) {
            setDataError(error instanceof Error ? error.message : "Reset failed. Please try again.");
        } finally {
            setResetting(false);
        }
    };

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

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white">Data Export &amp; Reset</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Download the current data as an Excel file, or permanently clear records. API
                        sources and other configuration/settings are never affected by these actions.
                    </p>
                </div>

                {tablesLoading ? (
                    <p className="text-sm text-zinc-400">Loading tables...</p>
                ) : (
                    <>
                        <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/70 text-xs uppercase tracking-wide text-zinc-500">
                                    <tr>
                                        <th className="px-4 py-2">
                                            <input
                                                type="checkbox"
                                                checked={dataTables.length > 0 && selectedTables.length === dataTables.length}
                                                onChange={toggleAllTables}
                                                className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
                                            />
                                        </th>
                                        <th className="px-4 py-2">Table</th>
                                        <th className="px-4 py-2">Records</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {dataTables.map((table) => (
                                        <tr key={table.key} className="text-zinc-300">
                                            <td className="px-4 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTables.includes(table.key)}
                                                    onChange={() => toggleTable(table.key)}
                                                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-950"
                                                />
                                            </td>
                                            <td className="px-4 py-2">{table.label}</td>
                                            <td className="px-4 py-2 text-zinc-500">{table.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="mb-4 text-xs text-zinc-500">
                            {selectedTables.length === 0
                                ? "No tables selected — actions apply to all tables."
                                : `${selectedTables.length} table(s) selected.`}
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={onExport}
                                disabled={exporting}
                                className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {exporting ? "Exporting..." : "Export to Excel"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setResetModalOpen(true)}
                                disabled={resetting}
                                className="flex-1 rounded-xl border border-red-500/40 bg-red-600/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Reset Data
                            </button>
                        </div>

                        {dataMessage && <p className="mt-3 text-sm text-emerald-400">{dataMessage}</p>}
                        {dataError && <p className="mt-3 text-sm text-red-400">{dataError}</p>}
                    </>
                )}
            </div>

            {resetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-950 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white">Confirm Data Reset</h3>
                        <p className="mt-2 text-sm text-zinc-400">
                            This will permanently delete{" "}
                            {selectedTables.length === 0
                                ? "ALL records in every table"
                                : `records from ${selectedTables.length} selected table(s)`}
                            . This action cannot be undone.
                        </p>
                        <p className="mt-3 text-sm text-zinc-400">
                            Type <span className="font-mono font-semibold text-red-300">RESET</span> to confirm.
                        </p>
                        <input
                            type="text"
                            value={resetConfirmText}
                            onChange={(event) => setResetConfirmText(event.target.value)}
                            placeholder="RESET"
                            className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500/60"
                        />
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setResetModalOpen(false);
                                    setResetConfirmText("");
                                }}
                                disabled={resetting}
                                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirmReset}
                                disabled={resetConfirmText !== "RESET" || resetting}
                                className="rounded-xl border border-red-500/40 bg-red-600/30 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-600/40 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {resetting ? "Resetting..." : "Confirm Reset"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
