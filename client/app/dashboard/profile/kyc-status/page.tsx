"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { useHydratedUser } from "@/hooks/useHydratedUser";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const UPLOADS_BASE = API_BASE.replace(/\/api\/?$/, "");

const documentItems = [
    { key: "companyProof", label: "Company Proof" },
    { key: "panCard", label: "PAN Card" },
    { key: "aadhaarCard", label: "Aadhaar Card" },
    { key: "selfie", label: "Selfie" },
] as const;

export default function KycStatusPage() {
    const { loading, user } = useHydratedUser();

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <p className="text-zinc-400">Loading submitted documents...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <section className="card">
                <div className="mb-4 flex items-center gap-3">
                    <Link
                        href="/dashboard/profile"
                        className="inline-grid h-9 w-9 place-items-center rounded-md border border-zinc-700 text-zinc-100"
                        aria-label="Back to profile"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-semibold">KYC Status</h1>
                </div>

                <div className="mb-4">
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                        {user?.kycStatus || "pending"}
                    </span>
                </div>

                <div className="space-y-3">
                    {documentItems.map((item) => {
                        const filePath = user?.kycDocuments?.[item.key];
                        const fileUrl = filePath ? `${UPLOADS_BASE}/${filePath}` : "";
                        const isPdf = filePath?.toLowerCase().endsWith(".pdf");

                        return (
                            <div key={item.key} className="relative rounded-xl border border-zinc-800 p-3">
                                <span className="absolute right-3 top-3 rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-[11px] font-medium text-yellow-300">
                                    Processing...
                                </span>
                                <p className="mb-2 pr-24 text-sm font-medium text-zinc-200">{item.label}</p>

                                {!filePath && <p className="text-sm text-zinc-500">No file submitted</p>}

                                {filePath && isPdf && (
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-indigo-300 underline"
                                    >
                                        Open PDF
                                    </a>
                                )}

                                {filePath && !isPdf && (
                                    <img
                                        src={fileUrl}
                                        alt={item.label}
                                        className="max-h-52 w-full rounded-lg border border-zinc-800 object-contain"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}