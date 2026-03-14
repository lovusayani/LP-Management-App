import { apiFetch } from "./api";
import { updateSessionUser } from "./session.service";
import {
  DepositeRecord,
  SubmitDepositePayload,
  User,
  UserSettings,
  WalletBalances,
  WalletSwapHistoryRecord,
  WalletSwapDirection,
  WithdrawWallet,
  WithdrawRecord,
} from "@/types";

export interface UserTradeLogRecord {
  id: string;
  sl_id: number;
  trade_id: string;
  LP_name: string;
  trade_date: string;
  trade_time: string;
  trade_pair: string;
  trade_val: number;
  trade_type: "profit" | "loss";
  margin: number;
  profit: number;
  old_trade_bal: number;
  curr_trade_bal: number;
  createdAt?: string;
}

export interface UserTradeLogListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  records: UserTradeLogRecord[];
}

export interface PushNotificationStatus {
  enabled: boolean;
  tokenCount: number;
  serverConfigured: boolean;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
}

export const completeOnboarding = async (): Promise<void> => {
  await apiFetch<{ message: string }>("/user/onboarding/complete", {
    method: "POST",
  });
  const profile = await getProfile();
  updateSessionUser(profile);
};

export const submitKycDocuments = async (files: {
  companyProof: File;
  panCard: File;
  aadhaarCard: File;
  selfie: File;
}): Promise<void> => {
  const formData = new FormData();
  formData.append("companyProof", files.companyProof);
  formData.append("panCard", files.panCard);
  formData.append("aadhaarCard", files.aadhaarCard);
  formData.append("selfie", files.selfie);

  await apiFetch<{ message: string }>("/user/kyc", {
    method: "POST",
    formData,
  });

  const profile = await getProfile();
  updateSessionUser(profile);
};

export const getProfile = async (): Promise<User> => {
  const data = await apiFetch<{ user: User }>("/user/profile", { method: "GET" });
  return data.user;
};

export const getPushNotificationStatus = async (): Promise<PushNotificationStatus> => {
  return apiFetch<PushNotificationStatus>("/user/push/status", { method: "GET" });
};

export const registerPushToken = async (token: string): Promise<PushNotificationStatus> => {
  return apiFetch<PushNotificationStatus>("/user/push/register", {
    method: "POST",
    body: { token },
  });
};

export const unregisterPushToken = async (token?: string): Promise<PushNotificationStatus> => {
  return apiFetch<PushNotificationStatus>("/user/push/unregister", {
    method: "DELETE",
    body: token ? { token } : {},
  });
};

export const sendTestPush = async (payload?: {
  title?: string;
  body?: string;
  url?: string;
}): Promise<{
  message: string;
  requested: number;
  successCount: number;
  failureCount: number;
  removedInvalidTokens: number;
}> => {
  return apiFetch<{
    message: string;
    requested: number;
    successCount: number;
    failureCount: number;
    removedInvalidTokens: number;
  }>("/user/push/test", {
    method: "POST",
    body: payload || {},
  });
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
  const data = await apiFetch<{ user: User }>("/user/profile", {
    method: "PUT",
    body: payload,
  });

  updateSessionUser(data.user);
  return data.user;
};

export const uploadProfileAvatar = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append("avatar", file);

  const data = await apiFetch<{ user: User }>("/user/profile/avatar", {
    method: "POST",
    formData,
  });

  updateSessionUser(data.user);
  return data.user;
};

export const getSettings = async (): Promise<UserSettings> => {
  const data = await apiFetch<{ settings: UserSettings }>("/user/settings", { method: "GET" });
  return data.settings;
};

export const updateSettings = async (settings: UserSettings): Promise<UserSettings> => {
  const data = await apiFetch<{ settings: UserSettings }>("/user/settings", {
    method: "PUT",
    body: settings,
  });

  const profile = await getProfile();
  updateSessionUser(profile);
  return data.settings;
};

export const getTransactionAccess = async (): Promise<{ allowed: boolean; message: string }> => {
  return apiFetch<{ allowed: boolean; message: string }>("/user/transaction-access", {
    method: "GET",
  });
};

export const submitDeposite = async (
  payload: SubmitDepositePayload
): Promise<DepositeRecord> => {
  const formData = new FormData();
  formData.append("amount", String(payload.amount));
  formData.append("depositeType", payload.depositeType);

  if (payload.network) {
    formData.append("network", payload.network);
  }

  formData.append("remarks", payload.remarks);
  formData.append("screenshot", payload.screenshot);

  const data = await apiFetch<{ deposite: DepositeRecord }>("/user/deposite", {
    method: "POST",
    formData,
  });

  return data.deposite;
};

export const getDepositeHistory = async (): Promise<DepositeRecord[]> => {
  const data = await apiFetch<{ records: DepositeRecord[] }>("/user/deposite-history", {
    method: "GET",
  });

  return data.records;
};

export const getWalletBalances = async (): Promise<WalletBalances> => {
  const data = await apiFetch<{ balances: WalletBalances }>("/user/wallet/balances", {
    method: "GET",
  });

  return data.balances;
};

export const swapWalletBalance = async (
  direction: WalletSwapDirection,
  amount: number
): Promise<WalletBalances> => {
  const data = await apiFetch<{ balances: WalletBalances }>("/user/wallet/swap", {
    method: "POST",
    body: { direction, amount },
  });

  return data.balances;
};

export const getWalletSwapHistory = async (): Promise<WalletSwapHistoryRecord[]> => {
  const data = await apiFetch<{ records: WalletSwapHistoryRecord[] }>("/user/wallet/swap-history", {
    method: "GET",
  });

  return data.records;
};

export const getMyTradeLogs = async (page = 1, limit = 10): Promise<UserTradeLogListResponse> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  return apiFetch<UserTradeLogListResponse>(`/user/trades?page=${safePage}&limit=${safeLimit}`, {
    method: "GET",
  });
};

export const getWithdrawWallet = async (): Promise<WithdrawWallet | null> => {
  const data = await apiFetch<{ withdrawWallet: WithdrawWallet | null }>("/user/withdraw/wallet", {
    method: "GET",
  });
  return data.withdrawWallet;
};

export const saveWithdrawWallet = async (payload: WithdrawWallet): Promise<WithdrawWallet> => {
  const data = await apiFetch<{ withdrawWallet: WithdrawWallet }>("/user/withdraw/wallet", {
    method: "POST",
    body: payload,
  });
  return data.withdrawWallet;
};

export const createWithdraw = async (amount: number): Promise<WithdrawRecord> => {
  const data = await apiFetch<{ withdraw: WithdrawRecord }>("/user/withdraw", {
    method: "POST",
    body: { amount },
  });
  return data.withdraw;
};

export const getWithdrawHistory = async (): Promise<WithdrawRecord[]> => {
  const data = await apiFetch<{ records: WithdrawRecord[] }>("/user/withdraw/history", {
    method: "GET",
  });
  return data.records;
};

export interface UserPnlUploadRecord {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  targetUserId?: string;
  targetUserName?: string;
  uploadedAt: string;
}

export const getUserPnlUploads = async (): Promise<UserPnlUploadRecord[]> => {
  const data = await apiFetch<{ uploads: Array<UserPnlUploadRecord & { _id?: string }> }>(
    "/user/pnl-uploads",
    { method: "GET" }
  );
  return data.uploads.map((r) => ({ ...r, id: r.id || r._id || "" }));
};

export const downloadPnlFile = async (id: string, originalName: string): Promise<void> => {
  const { getSession } = await import("./session.service");
  const session = getSession();

  const resolveBase = (): string => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    const host = window.location.hostname;
    if (host === "10.0.2.2") return "http://10.0.2.2:5000/api";
    if (host === "127.0.0.1") return "http://127.0.0.1:5000/api";
    return `http://${host}:5000/api`;
  };

  const url = `${resolveBase()}/user/pnl-uploads/${id}/download`;
  const headers: Record<string, string> = {};
  if (session?.accessToken) headers["Authorization"] = `Bearer ${session.accessToken}`;

  const response = await fetch(url, { method: "GET", headers, credentials: "include" });
  if (!response.ok) throw new Error("Download failed");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = originalName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

export interface UserPageContent {
  slug: string;
  title: string;
  content: string;
}

export const getPageContent = async (slug: string): Promise<UserPageContent> => {
  return apiFetch<UserPageContent>(`/user/page-content/${slug}`, { method: "GET" });
};
