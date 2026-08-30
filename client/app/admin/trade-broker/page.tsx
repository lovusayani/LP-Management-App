"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminTradeBrokerIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/trade-broker/report");
    }, [router]);

    return null;
}
