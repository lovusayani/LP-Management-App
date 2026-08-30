import { apiFetch } from "./api";

export interface SuimfxTrade {
    trade_id: string;
    username: string;
    symbol: string;
    position: "Buy" | "Sell";
    lot_size?: number;
    open_amount: number;
    close_amount: number | null;
    used_margin?: number;
    pnl: number;
    open_datetime: string;
    close_datetime: string | null;
    status: "Open" | "Closed";
    source: string;
}

interface TradesResponse {
    success: boolean;
    data: SuimfxTrade[];
    total: number;
    limit: number;
    offset: number;
}

export const getTrades = (params: { status?: "open" | "closed" | "all"; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();

    return apiFetch<TradesResponse>(`/trades${qs ? `?${qs}` : ""}`);
};
