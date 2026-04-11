"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { getAdminPaymentSetup, updateAdminPaymentSetup, uploadAdminPaymentQr, deleteAdminPaymentQr } from "@/services/admin.service";
import { getPublicAssetUrl } from "@/services/api";
import { PaymentSetupConfig } from "@/types";

const NETWORKS = ["TRC20", "ERC20", "BEP20"] as const;

type PaymentNetwork = (typeof NETWORKS)[number];

export default function PaymentSetupPage() {
    const [paymentSetup, setPaymentSetup] = useState<PaymentSetupConfig | null>(null);
    const [walletAddresses, setWalletAddresses] = useState<Record<PaymentNetwork, string>>({
        TRC20: "",
        ERC20: "",
        BEP20: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingNetwork, setUploadingNetwork] = useState<PaymentNetwork | null>(null);
    const [deletingNetwork, setDeletingNetwork] = useState<PaymentNetwork | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const config = await getAdminPaymentSetup();
                setPaymentSetup(config);
                setWalletAddresses({
                    TRC20: config.networks.TRC20.walletAddress,
                    ERC20: config.networks.ERC20.walletAddress,
                    BEP20: config.networks.BEP20.walletAddress,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load payment settings");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleAddressChange = (network: PaymentNetwork, value: string) => {
        setWalletAddresses((current) => ({ ...current, [network]: value }));
    };

    const handleSaveAddresses = async () => {
        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const config = await updateAdminPaymentSetup({
                walletAddresses: {
                    TRC20: walletAddresses.TRC20,
                    ERC20: walletAddresses.ERC20,
                    BEP20: walletAddresses.BEP20,
                },
            });

            setPaymentSetup(config);
            setMessage("Payment wallet addresses saved successfully.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save payment setup");
        } finally {
            setSaving(false);
        }
    };

    const handleUploadQr = async (network: PaymentNetwork, file: File) => {
        setUploadingNetwork(network);
        setError(null);
        setMessage(null);

        try {
            const config = await uploadAdminPaymentQr(network, file);
            setPaymentSetup(config);
            setMessage(`${network} QR uploaded successfully.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload QR code");
        } finally {
            setUploadingNetwork(null);
        }
    };

    const handleDeleteQr = async (network: PaymentNetwork) => {
        setDeletingNetwork(network);
        setError(null);
        setMessage(null);

        try {
            const config = await deleteAdminPaymentQr(network);
            setPaymentSetup(config);
            setMessage(`${network} QR deleted successfully.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete QR code");
        } finally {
            setDeletingNetwork(null);
        }
    };

    if (loading) {
        return (
            <section className="space-y-5">
                <div>
                    <h1 className="text-2xl font-semibold">Payment Setup</h1>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-white">Loading payment settings...</div>
            </section>
        );
    }

    return (
        <section className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Payment Setup</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Upload QR codes and update deposit wallet addresses for each supported network.
                </p>
            </div>

            {message && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-200">{message}</div>}
            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">{error}</div>}

            <div className="grid gap-6 rounded-2xl border border-white/10 bg-black/25 p-6 text-white shadow-xl backdrop-blur-sm lg:grid-cols-[1.8fr_1fr]">
                <div className="space-y-6">
                    {NETWORKS.map((network) => {
                        const currentAddress = walletAddresses[network];
                        const qrPath = paymentSetup?.networks?.[network]?.qrCodePath || "";
                        const qrUrl = qrPath ? getPublicAssetUrl(qrPath) : "";

                        return (
                            <div key={network} className="rounded-2xl border border-white/10 bg-[#10183f] p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold">{network}</h2>
                                        <p className="text-sm text-zinc-400">Upload QR and update the wallet address for {network} deposits.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10">
                                            Upload QR
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                    const file = event.target.files?.[0];
                                                    if (file) {
                                                        handleUploadQr(network, file);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {qrPath ? (
                                            <button
                                                type="button"
                                                disabled={deletingNetwork === network}
                                                onClick={() => handleDeleteQr(network)}
                                                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingNetwork === network ? "Deleting..." : "Delete QR"}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                                    <div className="space-y-3">
                                        <label className="block text-sm text-zinc-300">Wallet Address</label>
                                        <input
                                            type="text"
                                            value={currentAddress}
                                            onChange={(event) => handleAddressChange(network, event.target.value)}
                                            className="w-full rounded-lg border border-white/10 bg-[#0f1638] px-3 py-2 text-sm text-white outline-none"
                                            placeholder={`Enter ${network} wallet address`}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm text-zinc-300">QR Code</label>
                                        {qrUrl ? (
                                            <img src={qrUrl} alt={`${network} QR code`} className="h-36 w-full rounded-xl object-contain border border-white/10 bg-[#0c112f] p-3" />
                                        ) : (
                                            <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#0c112f] text-sm text-zinc-500">
                                                No QR code uploaded yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0c1224] p-5 lg:p-6">
                    <div className="rounded-2xl border border-white/10 bg-[#10183f] p-4">
                        <h2 className="text-lg font-semibold">QR Upload Setup</h2>
                        <p className="mt-2 text-sm text-zinc-400">
                            All three networks are managed in the left panel. Upload QR codes and update wallet addresses there, then save the configuration from this panel.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#10183f] p-4">
                        <h3 className="text-sm font-semibold text-white">Configuration Status</h3>
                        <div className="mt-3 space-y-3 text-sm text-zinc-300">
                            {NETWORKS.map((network) => {
                                const config = paymentSetup?.networks?.[network];
                                const ready = Boolean(config?.walletAddress?.trim() && config?.qrCodePath?.trim());
                                return (
                                    <div key={network} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2">
                                        <span>{network}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ready ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                                            {ready ? "Ready" : "Incomplete"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAddresses}
                        disabled={saving}
                        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {saving ? "Saving wallet addresses..." : "Save Wallet Addresses"}
                    </button>
                </div>
            </div>
        </section>
    );
}
