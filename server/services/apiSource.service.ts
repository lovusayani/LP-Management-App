import { IApiSource } from "../models/ApiSource";

export interface ExternalTrade {
  trade_id: string;
  username: string;
  symbol: string;
  position: "Buy" | "Sell";
  open_amount: number;
  close_amount: number | null;
  pnl: number;
  open_datetime: string;
  close_datetime: string | null;
  status: "Open" | "Closed";
}

interface ExternalTradesResponse {
  success: boolean;
  data: ExternalTrade[];
  total: number;
  limit: number;
  offset: number;
  message?: string;
}

export interface FetchTradesParams {
  status?: "open" | "closed" | "all";
  days?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const fetchTradesFromSource = async (
  source: Pick<IApiSource, "baseUrl" | "apiKey" | "authHeader">,
  params: FetchTradesParams = {}
): Promise<ExternalTradesResponse> => {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.days) query.set("days", String(params.days));
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const url = `${source.baseUrl}?${query.toString()}`;

  const headers: Record<string, string> =
    source.authHeader === "bearer"
      ? { Authorization: `Bearer ${source.apiKey}` }
      : { "X-API-Key": source.apiKey };

  const response = await fetch(url, { headers });
  const data = (await response.json().catch(() => ({}))) as ExternalTradesResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};
