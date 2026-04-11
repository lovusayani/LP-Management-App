"use client";

export default function PaymentSetupPage() {
    return (
        <section className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold">Payment Setup</h1>
                <p className="mt-2 text-sm text-zinc-400">
                    Configure payment settings and provider options for the admin workspace.
                </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
                <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/50 px-6 py-12 text-center">
                    <h2 className="text-lg font-medium text-white">Coming Soon</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Payment setup tools will appear here in a future update.
                    </p>
                </div>
            </div>
        </section>
    );
}
