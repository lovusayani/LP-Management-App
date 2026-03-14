"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useHydratedUser } from "@/hooks/useHydratedUser";
import { clearKycSkipped, getNextRoute, markKycSkipped } from "@/services/session.service";
import { submitKycDocuments } from "@/services/user.service";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

type KycFiles = {
    companyProof?: File;
    panCard?: File;
    aadhaarCard?: File;
    selfie?: File;
};

export default function KycPage() {
    const router = useRouter();
    const { loading, user } = useHydratedUser();

    const [files, setFiles] = useState<KycFiles>({});
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }
        if (!user) {
            router.replace("/login");
            return;
        }
        if (user.mustChangePassword || !user.onboardingCompleted || user.kycSubmitted) {
            router.replace(getNextRoute(user));
        }
    }, [loading, router, user]);

    const allAttached = useMemo(
        () => files.companyProof && files.panCard && files.aadhaarCard && files.selfie,
        [files]
    );

    const pickFile = (key: keyof KycFiles, file?: File) => {
        if (!file) {
            return;
        }
        if (!ACCEPTED.includes(file.type)) {
            setError("Only image/pdf files are accepted.");
            return;
        }
        if (file.size > MAX_SIZE) {
            setError("Max file size is 5MB per document.");
            return;
        }
        setError("");
        setFiles((prev) => ({ ...prev, [key]: file }));
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!allAttached) {
            setError("Please attach all four documents.");
            return;
        }

        setSubmitting(true);
        try {
            await submitKycDocuments({
                companyProof: files.companyProof as File,
                panCard: files.panCard as File,
                aadhaarCard: files.aadhaarCard as File,
                selfie: files.selfie as File,
            });
            clearKycSkipped();
            setDone(true);
            setTimeout(() => router.replace("/dashboard"), 900);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const onSkip = async () => {
        setSubmitting(true);
        markKycSkipped();
        router.replace("/dashboard");
    };

    return (
        <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
            <form className="card space-y-4" onSubmit={onSubmit}>
                <h1 className="text-2xl font-semibold">KYC Submission</h1>
                <p className="text-sm text-zinc-400">Upload required image/pdf files. Max size 5MB each.</p>
                <p className="rounded-lg bg-amber-500/10 p-2 text-sm text-amber-300">
                    Note: Deposit and Withdraw features will remain disabled until your KYC is approved by admin.
                </p>

                {[
                    ["companyProof", "Company Proof"],
                    ["panCard", "PAN Card"],
                    ["aadhaarCard", "Aadhaar Card"],
                    ["selfie", "Selfie"],
                ].map(([key, label]) => (
                    <div key={key} className="space-y-1">
                        <label className="text-sm text-zinc-300">{label}</label>
                        <input
                            className="input"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) => pickFile(key as keyof KycFiles, event.target.files?.[0])}
                        />
                    </div>
                ))}

                {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{error}</p>}
                {done && (
                    <p className="rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-300">
                        KYC submitted. Status set to pending.
                    </p>
                )}

                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={submitting}
                        className="btn-secondary flex-1"
                    >
                        {submitting ? "Loading..." : "Skip for Now"}
                    </button>
                    <button
                        disabled={submitting || !allAttached}
                        className="btn-primary flex-1"
                    >
                        {submitting ? "Submitting..." : "Submit KYC"}
                    </button>
                </div>
            </form>
        </div>
    );
}
