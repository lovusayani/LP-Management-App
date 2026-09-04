import { Model } from "mongoose";

import { Deposite } from "../models/Deposite";
import { JobRun } from "../models/JobRun";
import { OrderCharge } from "../models/OrderCharge";
import { PnlUpload } from "../models/PnlUpload";
import { PushToken } from "../models/PushToken";
import { TradeLog } from "../models/TradeLog";
import { TradeWallet } from "../models/TradeWallet";
import { User } from "../models/User";
import { WalletDailySummary } from "../models/WalletDailySummary";
import { WalletTransfer } from "../models/WalletTransfer";
import { Withdraw } from "../models/Withdraw";

export interface DataTableDef {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  filter?: Record<string, unknown>;
  excludeFields: string[];
}

// Only actual transactional/record data lives here. API sources, payment setup,
// branding, charge settings and page content are configuration, not records,
// so they are intentionally excluded and never touched by export/reset.
export const DATA_TABLES: DataTableDef[] = [
  {
    key: "users",
    label: "LP Users",
    model: User,
    filter: { role: "lp" },
    excludeFields: ["password", "refreshTokenHash", "__v"],
  },
  { key: "deposits", label: "Deposits", model: Deposite, excludeFields: ["__v"] },
  { key: "withdrawals", label: "Withdrawals", model: Withdraw, excludeFields: ["__v"] },
  { key: "tradeLogs", label: "Trade Logs", model: TradeLog, excludeFields: ["__v"] },
  { key: "tradeWallets", label: "Trade Wallets", model: TradeWallet, excludeFields: ["__v"] },
  { key: "walletTransfers", label: "Wallet Transfers", model: WalletTransfer, excludeFields: ["__v"] },
  {
    key: "walletDailySummaries",
    label: "Wallet Daily Summaries",
    model: WalletDailySummary,
    excludeFields: ["__v"],
  },
  { key: "orderCharges", label: "Order Charges", model: OrderCharge, excludeFields: ["__v"] },
  { key: "pnlUploads", label: "PnL Uploads", model: PnlUpload, excludeFields: ["__v"] },
  { key: "pushTokens", label: "Push Tokens", model: PushToken, excludeFields: ["__v"] },
  { key: "jobRuns", label: "Job Runs", model: JobRun, excludeFields: ["__v"] },
];

export const getDataTable = (key: string): DataTableDef | undefined =>
  DATA_TABLES.find((table) => table.key === key);
