"use client";

import { ChangeEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, CheckCircle2, Pencil } from "lucide-react";

import { DashboardTopbar } from "@/mvc/frontend/views/dashboard/topbar.view";
import { useHydratedUser } from "@/hooks/useHydratedUser";
import { getPublicAssetUrl } from "@/services/api";
import { updateProfile, uploadProfileAvatar } from "@/services/user.service";

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { loading, user, setUser } = useHydratedUser();
    const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });

    useLayoutEffect(() => {
        const updateWidth = () => {
            setDeviceWidth(window.innerWidth || document.documentElement.clientWidth || 360);
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }

        const hasName = Boolean(user?.fullName?.trim());
        const hasKycStatus = Boolean(user?.kycStatus?.trim());
        const kycStatus = user?.kycStatus?.trim().toLowerCase();

        if (!hasName || !hasKycStatus) {
            router.replace("/kyc");
            return;
        }

        if (kycStatus === "not_submitted") {
            const timer = window.setTimeout(() => {
                router.replace("/kyc");
            }, 3000);

            return () => {
                window.clearTimeout(timer);
            };
        }
    }, [loading, router, user?.fullName, user?.kycStatus]);

    useEffect(() => {
        setProfileForm({
            fullName: user?.fullName?.trim() || "",
            phone: user?.phone?.trim() || "",
        });
    }, [user?.fullName, user?.phone]);

    const emailToShow = user?.email?.trim() || "No email found";
    const isPendingKyc = user?.kycStatus?.toLowerCase() === "pending";
    const isApprovedKyc = user?.kycStatus?.toLowerCase() === "approved";
    const topbarWidthStyle = deviceWidth ? { width: `${deviceWidth}px`, maxWidth: `${deviceWidth}px` } : undefined;
    const glassCardStyle = useMemo(
        () => ({
            background: "linear-gradient(180deg, hsl(var(--card) / 0.72), hsl(var(--card) / 0.48))",
            borderColor: "hsl(var(--border) / 0.88)",
            boxShadow: "0 18px 44px hsl(var(--foreground) / 0.10)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
        }),
        []
    );
    const glassTableStyle = useMemo(
        () => ({
            background: "hsl(var(--card) / 0.38)",
            borderColor: "hsl(var(--border) / 0.78)",
        }),
        []
    );
    const mutedTextStyle = useMemo(() => ({ color: "hsl(var(--muted-foreground))" }), []);
    const secondarySurfaceStyle = useMemo(
        () => ({ background: "hsl(var(--secondary) / 0.76)", color: "hsl(var(--foreground))" }),
        []
    );
    const profileHeroStyle = useMemo(
        () => ({
            background: "linear-gradient(180deg, hsl(var(--card) / 0.42), hsl(var(--card) / 0.2))",
            boxShadow: "0 24px 50px hsl(var(--foreground) / 0.18), inset 0 1px 0 hsl(var(--foreground) / 0.08)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            border: "1px solid hsl(var(--border) / 0.9)",
        }),
        []
    );
    const avatarSrc = user?.avatar ? getPublicAssetUrl(user.avatar) : "";
    const avatarInitials = (user?.fullName || "LP")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploadingAvatar(true);
        setStatusMessage("");

        try {
            const updated = await uploadProfileAvatar(file);
            setUser(updated);
            setStatusMessage("Profile photo updated");
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : "Could not upload profile photo");
        } finally {
            setUploadingAvatar(false);
            event.target.value = "";
        }
    };

    const onSaveProfile = async () => {
        setSavingProfile(true);
        setStatusMessage("");

        try {
            const updated = await updateProfile({
                fullName: profileForm.fullName,
                phone: profileForm.phone,
            });
            setUser(updated);
            setEditingProfile(false);
            setStatusMessage("Profile updated");
        } catch (error) {
            setStatusMessage(error instanceof Error ? error.message : "Could not update profile");
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <p className="text-zinc-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full pb-28">
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
                <div className="pointer-events-auto mx-auto" style={topbarWidthStyle}>
                    <DashboardTopbar title="Profile" showBack />
                </div>
            </div>

            <div className="space-y-0 px-3 pt-24 sm:px-4">
                <section className="relative z-20 rounded-[28px] px-4 py-6 md:px-6" >
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative flex h-[209px] w-[212px] items-center justify-center rounded-full" style={profileHeroStyle}>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-4 top-4 inline-grid h-10 w-10 place-items-center rounded-full border text-white"
                                style={{
                                    background: "hsl(var(--card) / 0.6)",
                                    borderColor: "hsl(var(--border) / 0.92)",
                                    boxShadow: "0 10px 24px hsl(var(--foreground) / 0.18)",
                                }}
                                aria-label="Upload profile photo"
                                disabled={uploadingAvatar}
                            >
                                <Camera className="h-4 w-4" />
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onAvatarChange}
                            />

                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt="Profile avatar"
                                    className="h-[176px] w-[176px] rounded-full object-cover"
                                    style={{ boxShadow: "0 18px 30px hsl(var(--foreground) / 0.18)" }}
                                />
                            ) : (
                                <div
                                    className="grid h-[176px] w-[176px] place-items-center rounded-full text-4xl font-semibold"
                                    style={{
                                        background: "linear-gradient(180deg, hsl(var(--secondary) / 0.95), hsl(var(--accent) / 0.72))",
                                        color: "hsl(var(--foreground))",
                                        boxShadow: "0 18px 30px hsl(var(--foreground) / 0.18)",
                                    }}
                                >
                                    {avatarInitials || "LP"}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="relative z-10 -mt-[52px] rounded-[24px] border p-4 md:p-6" style={glassCardStyle}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                                Profile
                            </h1>
                            <p className="mt-1 text-sm" style={mutedTextStyle}>
                                Your personal details and account verification status.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="rounded-2xl border px-4 py-3" style={glassTableStyle}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium uppercase tracking-[0.18em]" style={mutedTextStyle}>Name</p>
                                <button
                                    type="button"
                                    onClick={() => setEditingProfile((value) => !value)}
                                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
                                    style={{ borderColor: "hsl(var(--border) / 0.88)", color: "hsl(var(--foreground))" }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {editingProfile ? "Close" : "Edit"}
                                </button>
                            </div>
                            {editingProfile ? (
                                <input
                                    className="input mt-3"
                                    value={profileForm.fullName}
                                    onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
                                    placeholder="Enter your name"
                                />
                            ) : (
                                <p className="mt-2 text-base font-medium" style={{ color: "hsl(var(--foreground))" }}>{user?.fullName}</p>
                            )}
                        </div>

                        <div className="rounded-2xl border px-4 py-3" style={glassTableStyle}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium uppercase tracking-[0.18em]" style={mutedTextStyle}>Mobile Number</p>
                                {!editingProfile && (
                                    <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                                        {user?.phone?.trim() || "Not added"}
                                    </p>
                                )}
                            </div>
                            {editingProfile && (
                                <input
                                    className="input mt-3"
                                    value={profileForm.phone}
                                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                                    placeholder="Enter mobile number"
                                />
                            )}
                        </div>

                        <div className="rounded-2xl border px-4 py-3" style={glassTableStyle}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium uppercase tracking-[0.18em]" style={mutedTextStyle}>Email</p>
                                <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>{emailToShow}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border px-4 py-3" style={glassTableStyle}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium uppercase tracking-[0.18em]" style={mutedTextStyle}>KYC Status</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize"
                                        style={
                                            isApprovedKyc
                                                ? { background: "rgb(59 130 246 / 0.16)", color: "rgb(59 130 246)" }
                                                : isPendingKyc
                                                    ? { background: "rgb(234 179 8 / 0.18)", color: "rgb(202 138 4)" }
                                                    : secondarySurfaceStyle
                                        }
                                    >
                                        {isApprovedKyc && <CheckCircle2 className="h-3.5 w-3.5" />}
                                        {user?.kycStatus?.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>
                            {isPendingKyc && (
                                <div className="mt-3">
                                    <Link href="/dashboard/profile/kyc-status" className="btn-secondary px-3 py-1 text-xs">
                                        Check Status
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border px-4 py-3" style={glassTableStyle}>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium uppercase tracking-[0.18em]" style={mutedTextStyle}>Account Status</p>
                                <p className="text-sm font-semibold capitalize" style={{ color: "hsl(var(--foreground))" }}>{user?.status}</p>
                            </div>
                        </div>

                        {editingProfile && (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <button type="button" className="btn-primary" onClick={onSaveProfile} disabled={savingProfile}>
                                    {savingProfile ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setEditingProfile(false);
                                        setProfileForm({
                                            fullName: user?.fullName?.trim() || "",
                                            phone: user?.phone?.trim() || "",
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {statusMessage && (
                            <p className="text-sm" style={mutedTextStyle}>{statusMessage}</p>
                        )}
                    </div>
                </section>

                <section className="mt-4 rounded-[24px] border p-4 md:p-6" style={glassCardStyle}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                                History
                            </h2>
                            <p className="mt-1 text-sm" style={mutedTextStyle}>
                                Recent profile-related activity will appear here.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border" style={glassTableStyle}>
                        <table className="min-w-full text-sm" style={{ color: "hsl(var(--foreground))" }}>
                            <thead style={{ background: "hsl(var(--secondary) / 0.82)", color: "hsl(var(--muted-foreground))" }}>
                                <tr>
                                    <th className="px-3 py-3 text-left font-medium">Date</th>
                                    <th className="px-3 py-3 text-left font-medium">Action</th>
                                    <th className="px-3 py-3 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderTop: "1px solid hsl(var(--border) / 0.78)" }}>
                                    <td className="px-3 py-3" style={mutedTextStyle}>--</td>
                                    <td className="px-3 py-3">No records yet</td>
                                    <td className="px-3 py-3" style={mutedTextStyle}>--</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-4 rounded-[24px] border p-4 md:p-6" style={glassCardStyle}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
                                Reports
                            </h2>
                            <p className="mt-1 text-sm" style={mutedTextStyle}>
                                Download account statements and profile-related reports.
                            </p>
                        </div>
                        <Link href="/dashboard/profile/reports" className="btn-secondary">
                            Download Report
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
