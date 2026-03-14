"use client";

import { useEffect, useState } from "react";

import { TopbarPageFrame } from "@/components/dashboard/TopbarPageFrame";
import { getPageContent, UserPageContent } from "@/services/user.service";

export default function HelpPage() {
    const [data, setData] = useState<UserPageContent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPageContent("help")
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    return (
        <TopbarPageFrame title={loading ? "Help" : (data?.title || "Help")}>
            <h1 className="text-xl font-semibold">{loading ? "Help" : (data?.title || "Help")}</h1>
            {loading ? (
                <p className="text-sm text-zinc-400">Loading...</p>
            ) : data?.content ? (
                <div className="space-y-3">
                    {data.content.split(/\n\n+/).map((para, i) => (
                        <p key={i} className="text-sm text-zinc-300 leading-relaxed">
                            {para.split("\n").map((line, j) => (
                                <span key={j}>{line}{j < para.split("\n").length - 1 && <br />}</span>
                            ))}
                        </p>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-zinc-400">No content available.</p>
            )}
        </TopbarPageFrame>
    );
}
