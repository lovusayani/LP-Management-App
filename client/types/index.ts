export type Theme = "light" | "dark" | "system";
export type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";

export interface UserSettings {
  theme: Theme;
  fontSize: number;
  notificationSound: boolean;
  alerts: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  mainWalletBalance?: number;
  lockInBalance?: number;
  role: "admin" | "lp";
  status: "active" | "suspended";
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
  kycSubmitted: boolean;
  kycStatus: KycStatus;
  kycDocuments?: {
    companyProof?: string;
    panCard?: string;
    aadhaarCard?: string;
    selfie?: string;
  };
  settings: UserSettings;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type DepositeType = "on_chain" | "f2f" | "buy_crypto";
export type DepositeNetwork = "TRC20" | "ERC20" | "BEP20";
export type DepositeStatus = "pending" | "approved" | "rejected";

export interface DepositeRecord {
  id: string;
  amount: number;
  depositeType: DepositeType;
  network?: DepositeNetwork;
  walletAddress?: string;
  screenshot?: string;
  remarks?: string;
  status: DepositeStatus;
  createdAt?: string;
}

export interface SubmitDepositePayload {
  amount: number;
  depositeType: DepositeType;
  network?: DepositeNetwork;
  remarks: string;
  screenshot: File;
}

export type WalletSwapDirection = "main_to_trade" | "trade_to_main";

export type WithdrawChain = "TRC20" | "ERC20" | "BEP20";
export type WithdrawCurrency = "USDT" | "USD" | "INR";
export type WithdrawStatus = "processing" | "approved" | "cancelled" | "pending" | "rejected";

export interface WithdrawWallet {
  walletAddress: string;
  chainType: WithdrawChain;
  currency: WithdrawCurrency;
}

export interface WithdrawRecord {
  id: string;
  txId: string;
  amount: number;
  walletAddress: string;
  chainType: WithdrawChain;
  currency: WithdrawCurrency;
  status: WithdrawStatus;
  adminRemark?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface WalletBalances {
  mainWalletBalance: number;
  tradeWalletBalance: number;
  lockInBalance?: number;
}

export interface WalletSwapHistoryRecord {
  id: string;
  amount: number;
  direction: WalletSwapDirection;
  mainBalanceAfter: number;
  tradeBalanceAfter: number;
  createdAt?: string;
}
