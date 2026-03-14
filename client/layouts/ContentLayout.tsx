export function ContentLayout({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="card">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
            <div className="mt-4">{children}</div>
        </section>
    );
}
