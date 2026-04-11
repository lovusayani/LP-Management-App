import { apiFetch } from "./api";

export interface AdminLpUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  tradeWalletBalance?: number;
  lockInBalance?: number;
  mainWalletBalance?: number;
  status: "active" | "suspended";
  onboardingCompleted: boolean;
  kycSubmitted: boolean;
  kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
  kycDocuments?: {
    companyProof?: string;
    panCard?: string;
    aadhaarCard?: string;
    selfie?: string;
  };
  settings?: {
    alerts: boolean;
  };
  createdAt?: string;
}

export interface CreateLpUserPayload {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AdminDepositeUser {
  id: string;
  fullName: string;
  email: string;
  mainWalletBalance?: number;
}

export interface AdminDepositeRecord {
  id: string;
  amount: number;
  depositeType: "on_chain" | "f2f" | "buy_crypto";
  network?: "TRC20" | "ERC20" | "BEP20";
  walletAddress?: string;
  screenshot?: string;
  remarks?: string;
  status: "pending" | "approved" | "rejected";
  adminRemark?: string;
  reviewedAt?: string;
  createdAt?: string;
  user: AdminDepositeUser;
}

export interface CreateTradeLogPayload {
  lpUserId: string;
  tradePair: string;
  tradeVal: number;
  tradeType: "profit" | "loss";
  margin: number;
}

export interface AdminTradeLogRecord {
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

export interface AdminTradeLogListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  records: AdminTradeLogRecord[];
}

export interface AdminNotificationOverview {
  serverConfigured: boolean;
  totalLpUsers: number;
  usersWithPushEnabled: number;
  totalTokens: number;
}

export interface AdminPushSendResult {
  message: string;
  requested: number;
  successCount: number;
  failureCount: number;
  removedInvalidTokens: number;
}

export interface AdminWithdrawMethodRecord {
  id: string;
  fullName: string;
  email: string;
  mainWalletBalance: number;
  walletAddress: string;
  chainType: "TRC20" | "ERC20" | "BEP20";
  currency: "USDT" | "USD" | "INR";
  createdAt?: string;
}

export interface AdminWithdrawRequestUser {
  id: string;
  fullName: string;
  email: string;
  mainWalletBalance?: number;
}

export interface AdminWithdrawRequestRecord {
  id: string;
  txId: string;
  amount: number;
  walletAddress: string;
  chainType: "TRC20" | "ERC20" | "BEP20";
  currency: "USDT" | "USD" | "INR";
  status: "processing" | "approved" | "cancelled" | "pending" | "rejected";
  adminRemark?: string;
  reviewedAt?: string;
  createdAt?: string;
  user: AdminWithdrawRequestUser;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalMainBalance: number;
  totalTradeBalance: number;
  totalProfits: number;
  totalLosses: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netBalance: number;
}

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  return apiFetch<AdminDashboardStats>("/admin/stats", { method: "GET" });
};

export type PageSlug = "about" | "help" | "support" | "faq";

export interface PageContentRecord {
  slug: PageSlug;
  title: string;
  content: string;
}

export interface PaymentSetupConfig {
  networks: Record<"TRC20" | "ERC20" | "BEP20", { walletAddress: string; qrCodePath: string }>;
}

export interface UpdatePaymentSetupPayload {
  walletAddresses?: Partial<Record<"TRC20" | "ERC20" | "BEP20", string>>;
}

export const getAdminPaymentSetup = async (): Promise<PaymentSetupConfig> => {
  const data = await apiFetch<{ paymentSetup: PaymentSetupConfig }>(
    "/admin/payment-setup",
    { method: "GET" }
  );
  return data.paymentSetup;
};

export const updateAdminPaymentSetup = async (
  payload: UpdatePaymentSetupPayload
): Promise<PaymentSetupConfig> => {
  const data = await apiFetch<{ paymentSetup: PaymentSetupConfig }>(
    "/admin/payment-setup",
    {
      method: "PATCH",
      body: payload,
    }
  );
  return data.paymentSetup;
};

export const uploadAdminPaymentQr = async (
  network: "TRC20" | "ERC20" | "BEP20",
  file: File
): Promise<PaymentSetupConfig> => {
  const formData = new FormData();
  formData.append("qrCode", file);

  const data = await apiFetch<{ paymentSetup: PaymentSetupConfig }>(
    `/admin/payment-setup/qr/${network}`,
    {
      method: "POST",
      formData,
    }
  );
  return data.paymentSetup;
};

export const deleteAdminPaymentQr = async (
  network: "TRC20" | "ERC20" | "BEP20"
): Promise<PaymentSetupConfig> => {
  const data = await apiFetch<{ paymentSetup: PaymentSetupConfig }>(
    `/admin/payment-setup/qr/${network}`,
    {
      method: "DELETE",
    }
  );
  return data.paymentSetup;
};

export const getAdminPageContent = async (slug: PageSlug): Promise<PageContentRecord> => {
  return apiFetch<PageContentRecord>(`/admin/page-content/${slug}`, { method: "GET" });
};

export const updateAdminPageContent = async (
  slug: PageSlug,
  payload: { title: string; content: string }
): Promise<PageContentRecord> => {
  const data = await apiFetch<{ message: string; page: PageContentRecord }>(`/admin/page-content/${slug}`, {
    method: "PUT",
    body: payload,
  });
  return data.page;
};

export const getAllLpUsers = async (): Promise<AdminLpUser[]> => {
  const data = await apiFetch<{ users: Array<AdminLpUser & { _id?: string }> }>("/admin/users", {
    method: "GET",
  });

  return data.users.map((user) => ({
    ...user,
    id: user.id || user._id || "",
  }));
};

export const createLpUser = async (payload: CreateLpUserPayload): Promise<AdminLpUser> => {
  const data = await apiFetch<{ user: AdminLpUser & { _id?: string } }>("/admin/users", {
    method: "POST",
    body: payload,
  });

  return {
    ...data.user,
    id: data.user.id || data.user._id || "",
  };
};

export const updateLpUserStatus = async (
  userId: string,
  status: "active" | "suspended"
): Promise<void> => {
  await apiFetch<{ message: string }>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { status },
  });
};

export const updateLpUserPassword = async (userId: string, password: string): Promise<void> => {
  await apiFetch<{ message: string }>(`/admin/users/${userId}/password`, {
    method: "PATCH",
    body: { password },
  });
};

export const updateLpUserKycStatus = async (
  userId: string,
  kycStatus: "approved" | "rejected" | "pending"
): Promise<void> => {
  await apiFetch<{ message: string }>(`/admin/users/${userId}/kyc-status`, {
    method: "PATCH",
    body: { kycStatus },
  });
};

export const updateLpUserLockInBalance = async (
  userId: string,
  lockInBalance: number
): Promise<void> => {
  await apiFetch<{ message: string }>(`/admin/users/${userId}/lock-in-balance`, {
    method: "PATCH",
    body: { lockInBalance },
  });
};

export const adjustAdminLpMainBalance = async (
  userId: string,
  payload: {
    action: "credit" | "debit";
    amount: number;
    category: string;
    note?: string;
  }
): Promise<{ message: string; user: { id: string; fullName: string; mainWalletBalance: number } }> => {
  return apiFetch<{ message: string; user: { id: string; fullName: string; mainWalletBalance: number } }>(
    `/admin/users/${userId}/main-balance`,
    {
      method: "PATCH",
      body: payload,
    }
  );
};

export const getAllAdminDeposites = async (): Promise<AdminDepositeRecord[]> => {
  const data = await apiFetch<{ records: Array<AdminDepositeRecord & { _id?: string }> }>(
    "/admin/deposits",
    {
      method: "GET",
    }
  );

  return data.records.map((record) => ({
    ...record,
    id: record.id || record._id || "",
    user: {
      ...record.user,
      id: record.user.id || "",
    },
  }));
};

export const getAdminDepositeById = async (depositeId: string): Promise<AdminDepositeRecord> => {
  const data = await apiFetch<{ deposite: AdminDepositeRecord & { _id?: string } }>(
    `/admin/deposits/${depositeId}`,
    {
      method: "GET",
    }
  );

  return {
    ...data.deposite,
    id: data.deposite.id || data.deposite._id || "",
    user: {
      ...data.deposite.user,
      id: data.deposite.user.id || "",
    },
  };
};

export const reviewAdminDeposite = async (
  depositeId: string,
  status: "approved" | "rejected",
  adminRemark?: string
): Promise<void> => {
  await apiFetch<{ message: string }>(`/admin/deposits/${depositeId}/status`, {
    method: "PATCH",
    body: { status, adminRemark },
  });
};

export const createAdminTradeLog = async (
  payload: CreateTradeLogPayload
): Promise<AdminTradeLogRecord> => {
  const data = await apiFetch<{ trade: AdminTradeLogRecord }>("/admin/trades", {
    method: "POST",
    body: payload,
  });

  return data.trade;
};

export const getAdminTradeLogs = async (
  page = 1,
  limit = 10
): Promise<AdminTradeLogListResponse> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);

  return apiFetch<AdminTradeLogListResponse>(`/admin/trades?page=${safePage}&limit=${safeLimit}`, {
    method: "GET",
  });
};

export const getAdminNotificationOverview = async (): Promise<AdminNotificationOverview> => {
  return apiFetch<AdminNotificationOverview>("/admin/notifications/overview", {
    method: "GET",
  });
};

export const sendAdminPushToAllUsers = async (payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<AdminPushSendResult> => {
  return apiFetch<AdminPushSendResult>("/admin/notifications/send-all", {
    method: "POST",
    body: payload,
  });
};

export const sendAdminPushToSingleUser = async (
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<AdminPushSendResult> => {
  return apiFetch<AdminPushSendResult>(`/admin/notifications/users/${userId}/send`, {
    method: "POST",
    body: payload,
  });
};

export const updateAdminUserPushPreference = async (
  userId: string,
  enabled: boolean
): Promise<{ message: string; enabled: boolean; tokenCount: number }> => {
  return apiFetch<{ message: string; enabled: boolean; tokenCount: number }>(
    `/admin/notifications/users/${userId}/push-preference`,
    {
      method: "PATCH",
      body: { enabled },
    }
  );
};

export const getAdminWithdrawMethods = async (): Promise<AdminWithdrawMethodRecord[]> => {
  const data = await apiFetch<{ records: Array<AdminWithdrawMethodRecord & { _id?: string }> }>(
    "/admin/withdrawals/methods",
    {
      method: "GET",
    }
  );

  return data.records.map((record) => ({
    ...record,
    id: record.id || record._id || "",
  }));
};

export const getAdminWithdrawRequests = async (): Promise<AdminWithdrawRequestRecord[]> => {
  const data = await apiFetch<{ records: Array<AdminWithdrawRequestRecord & { _id?: string }> }>(
    "/admin/withdrawals/requests",
    {
      method: "GET",
    }
  );

  return data.records.map((record) => ({
    ...record,
    id: record.id || record._id || "",
    user: {
      ...record.user,
      id: record.user.id || "",
    },
  }));
};

export const reviewAdminWithdrawRequest = async (
  withdrawId: string,
  status: "approved" | "rejected",
  adminRemark?: string
): Promise<{ message: string; status: string }> => {
  return apiFetch<{ message: string; status: string }>(`/admin/withdrawals/${withdrawId}/status`, {
    method: "PATCH",
    body: { status, adminRemark },
  });
};

export interface PnlUploadRecord {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  targetUserId?: string;
  targetUserName?: string;
  uploadedAt: string;
}

export const uploadAdminPnlFiles = async (files: File[], targetUserId: string): Promise<PnlUploadRecord[]> => {
  const formData = new FormData();
  formData.append("targetUserId", targetUserId);
  files.forEach((file) => formData.append("files", file));

  const data = await apiFetch<{ uploads: Array<PnlUploadRecord & { _id?: string }> }>(
    "/admin/pnl-uploads",
    { method: "POST", formData }
  );

  return data.uploads.map((r) => ({ ...r, id: r.id || r._id || "" }));
};

export const getAdminPnlUploads = async (): Promise<PnlUploadRecord[]> => {
  const data = await apiFetch<{ uploads: Array<PnlUploadRecord & { _id?: string }> }>(
    "/admin/pnl-uploads",
    { method: "GET" }
  );

  return data.uploads.map((r) => ({ ...r, id: r.id || r._id || "" }));
};

export const deleteAdminPnlUpload = async (id: string): Promise<void> => {
  await apiFetch<{ message: string }>(`/admin/pnl-uploads/${id}`, { method: "DELETE" });
};
