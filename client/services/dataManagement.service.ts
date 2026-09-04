import { API_BASE } from "./api";
import { getSession } from "./session.service";

export interface DataTableInfo {
  key: string;
  label: string;
  count: number;
}

export interface ResetTableResult {
  key: string;
  label: string;
  deletedCount: number;
}

export const getDataTables = async (): Promise<DataTableInfo[]> => {
  const session = getSession();
  const response = await fetch(`${API_BASE}/admin/data/tables`, {
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load tables");
  }

  return data.tables as DataTableInfo[];
};

export const exportDataTables = async (tables: string[]): Promise<void> => {
  const session = getSession();
  const query = tables.length === 0 ? "all" : tables.join(",");

  const response = await fetch(`${API_BASE}/admin/data/export?tables=${encodeURIComponent(query)}`, {
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || "Failed to export data");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const fileName = match ? match[1] : `lp-data-export-${Date.now()}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const resetDataTables = async (
  tables: string[],
  confirmText: string
): Promise<ResetTableResult[]> => {
  const session = getSession();
  const response = await fetch(`${API_BASE}/admin/data/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ tables, confirmText }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Failed to reset data");
  }

  return data.results as ResetTableResult[];
};
