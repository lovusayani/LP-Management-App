import { AuthSession } from "@/types";

import { clearSession, getSession, setSession } from "./session.service";

const resolveApiBase = (): string => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  }

  const host = window.location.hostname;

  // Android emulator maps host machine localhost to 10.0.2.2.
  // Prioritize this route even if NEXT_PUBLIC_API_URL is set to localhost.
  if (host === "10.0.2.2") {
    return "http://10.0.2.2:5000/api";
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (host === "127.0.0.1") {
    return "http://127.0.0.1:5000/api";
  }

  if (host === "localhost") {
    return "http://localhost:5000/api";
  }

  return `http://${host}:5000/api`;
};

const API_BASE = resolveApiBase();

export const getPublicAssetUrl = (path: string): string => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const assetPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE.replace(/\/api$/, "")}${assetPath}`;
};

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  formData?: FormData;
  retry?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new ApiError((data as { message?: string }).message || "Request failed", response.status);
  }
  return data;
};

const refreshSession = async (session: AuthSession): Promise<AuthSession | null> => {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      credentials: "include",
    });

    const data = await parseResponse<AuthSession>(response);
    setSession(data);
    return data;
  } catch {
    clearSession();
    return null;
  }
};

export const apiFetch = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const session = getSession();

  const headers: Record<string, string> = {
    ...(options.formData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (options.auth !== false && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.formData ? options.formData : options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  if (response.status === 401 && options.auth !== false && options.retry !== false && session) {
    const refreshed = await refreshSession(session);
    if (!refreshed) {
      throw new Error("Session expired. Please log in again.");
    }

    return apiFetch<T>(path, { ...options, retry: false });
  }

  return parseResponse<T>(response);
};
