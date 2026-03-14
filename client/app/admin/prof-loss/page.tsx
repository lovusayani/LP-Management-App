"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Upload } from "lucide-react";

import {
    AdminLpUser,
    AdminTradeLogRecord,
    createAdminTradeLog,
    getAdminTradeLogs,
    getAllLpUsers,
} from "@/services/admin.service";

import styles from "./page.module.css";

type SetType = "profit" | "loss";

const DEFAULT_TRADE_PAIRS = ["USD/INR", "JPY/USD", "XAP/CZH", "EUR/USD", "GBP/USD"];

const normalizeTradePair = (value: string): string => {
    const raw = String(value || "").trim().toUpperCase();
    const compact = raw.replace(/\s+/g, "");
    if (!compact.includes("/") && compact.includes("-")) {
        return compact.replace("-", "/");
    }
    return compact;
};

const isValidTradePair = (value: string): boolean => /^[A-Z]{2,10}\/[A-Z]{2,10}$/.test(value);

interface CalculationSummary {
    lpName: string;
    tradePair: string;
    tradeValue: number;
    marginPercent: number;
    pnlAmount: number;
    tradeResultBalance: number;
    oldRestWalletBalance: number;
    currentBalance: number;
    type: SetType;
}

export default function AdminProfLossPage() {
    const router = useRouter();
    const lpPageSize = 6;
    const tradePageSize = 8;
    const [lpUsers, setLpUsers] = useState<AdminLpUser[]>([]);
    const [loadingLpUsers, setLoadingLpUsers] = useState(true);
    const [lpCurrentPage, setLpCurrentPage] = useState(1);
    const [tradeLogs, setTradeLogs] = useState<AdminTradeLogRecord[]>([]);
    const [loadingTradeLogs, setLoadingTradeLogs] = useState(true);
    const [savingTrade, setSavingTrade] = useState(false);
    const [tradeSaveMessage, setTradeSaveMessage] = useState("");
    const [tradeCurrentPage, setTradeCurrentPage] = useState(1);
    const [tradeTotalPages, setTradeTotalPages] = useState(1);
    const [tradeTotalCount, setTradeTotalCount] = useState(0);
    const [lpName, setLpName] = useState("");
    const [tradePair, setTradePair] = useState("");
    const [amount, setAmount] = useState("");
    const [amountError, setAmountError] = useState("");
    const [panelError, setPanelError] = useState("");
    const [percentage, setPercentage] = useState("");
    const [setType, setSetType] = useState<SetType>("profit");
    const [calculation, setCalculation] = useState<CalculationSummary | null>(null);
    const [tradePairs, setTradePairs] = useState<string[]>(DEFAULT_TRADE_PAIRS);
    const [showPairModal, setShowPairModal] = useState(false);
    const [pairDraft, setPairDraft] = useState("");
    const [pairError, setPairError] = useState("");
    const [editingPair, setEditingPair] = useState<string | null>(null);

    const selectedLpUser = useMemo(
        () => lpUsers.find((user) => user.id === lpName) || null,
        [lpName, lpUsers]
    );

    const totalPages = useMemo(() => {
        if (!lpUsers.length) {
            return 1;
        }

        return Math.ceil(lpUsers.length / lpPageSize);
    }, [lpUsers.length]);

    const paginatedLpUsers = useMemo(() => {
        const start = (lpCurrentPage - 1) * lpPageSize;
        return lpUsers.slice(start, start + lpPageSize);
    }, [lpCurrentPage, lpUsers]);

    const availableTradeWalletBalance = useMemo(() => {
        if (!selectedLpUser) {
            return 0;
        }

        const numericBalance = Number(selectedLpUser.tradeWalletBalance ?? 0);
        if (!Number.isFinite(numericBalance) || numericBalance <= 0) {
            return 0;
        }

        return numericBalance;
    }, [selectedLpUser]);

    const tradeWalletBalance = useMemo(() => {
        if (!selectedLpUser) {
            return "";
        }

        if (!amount) {
            return availableTradeWalletBalance.toFixed(2);
        }

        const enteredAmount = Number(amount);
        if (!Number.isFinite(enteredAmount) || enteredAmount < 0) {
            return availableTradeWalletBalance.toFixed(2);
        }

        const remaining = Math.max(availableTradeWalletBalance - enteredAmount, 0);
        return remaining.toFixed(2);
    }, [amount, availableTradeWalletBalance, selectedLpUser]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        try {
            const storedPairs = window.localStorage.getItem("admin_trade_pairs");
            if (!storedPairs) {
                return;
            }

            const parsed = JSON.parse(storedPairs) as unknown;
            if (!Array.isArray(parsed)) {
                return;
            }

            const validPairs = parsed
                .map((item) => normalizeTradePair(String(item || "")))
                .filter((item) => isValidTradePair(item));

            if (validPairs.length > 0) {
                setTradePairs(Array.from(new Set(validPairs)));
            }
        } catch {
            // ignore invalid local data
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem("admin_trade_pairs", JSON.stringify(tradePairs));
    }, [tradePairs]);

    useEffect(() => {
        let disposed = false;

        const loadLpUsers = async () => {
            setLoadingLpUsers(true);
            try {
                const users = await getAllLpUsers();
                if (!disposed) {
                    setLpUsers(users);
                }
            } catch {
                if (!disposed) {
                    setLpUsers([]);
                }
            } finally {
                if (!disposed) {
                    setLoadingLpUsers(false);
                }
            }
        };

        loadLpUsers();

        return () => {
            disposed = true;
        };
    }, []);

    useEffect(() => {
        let disposed = false;

        const loadTradeLogs = async () => {
            setLoadingTradeLogs(true);
            try {
                const data = await getAdminTradeLogs(tradeCurrentPage, tradePageSize);
                if (!disposed) {
                    setTradeLogs(data.records);
                    setTradeTotalPages(data.totalPages || 1);
                    setTradeTotalCount(data.total || 0);
                }
            } catch {
                if (!disposed) {
                    setTradeLogs([]);
                    setTradeTotalPages(1);
                    setTradeTotalCount(0);
                }
            } finally {
                if (!disposed) {
                    setLoadingTradeLogs(false);
                }
            }
        };

        loadTradeLogs();

        return () => {
            disposed = true;
        };
    }, [tradeCurrentPage]);

    useEffect(() => {
        setAmount("");
        setAmountError("");
        setPanelError("");
        setCalculation(null);
    }, [lpName]);

    useEffect(() => {
        setLpCurrentPage(1);
    }, [lpUsers.length]);

    const onAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;

        if (!nextValue) {
            setAmount("");
            setAmountError("");
            setPanelError("");
            setCalculation(null);
            return;
        }

        const numericAmount = Number(nextValue);
        if (!Number.isFinite(numericAmount) || numericAmount < 0) {
            return;
        }

        if (availableTradeWalletBalance <= 0) {
            if (numericAmount > 0) {
                setAmount("0");
                setAmountError("NO trade wallet balance the LP have. Please select another LP");
                setPanelError("");
                setCalculation(null);
                return;
            }

            setAmount("0");
            setAmountError("");
            setPanelError("");
            setCalculation(null);
            return;
        }

        setAmountError("");
        setPanelError("");
        setCalculation(null);

        if (numericAmount > availableTradeWalletBalance) {
            setAmount(String(availableTradeWalletBalance));
            return;
        }

        setAmount(nextValue);
    };

    const onPercentageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPercentage(event.target.value);
        setPanelError("");
        setCalculation(null);
    };

    const runCalculation = (type: SetType): CalculationSummary | null => {
        setSetType(type);

        if (!selectedLpUser) {
            setPanelError("Please select an LP user.");
            setCalculation(null);
            return null;
        }

        if (!tradePair) {
            setPanelError("Please select a trade pair.");
            setCalculation(null);
            return null;
        }

        if (!amount || !percentage) {
            setPanelError("Please enter trade amount and percentage.");
            setCalculation(null);
            return null;
        }

        if (availableTradeWalletBalance <= 0) {
            setPanelError("NO trade wallet balance the LP have. Please select another LP");
            setCalculation(null);
            return null;
        }

        const tradeValue = Number(amount);
        const marginPercent = Number(percentage);

        if (!Number.isFinite(tradeValue) || !Number.isFinite(marginPercent) || tradeValue < 0 || marginPercent < 0) {
            setPanelError("Please enter valid numeric values.");
            setCalculation(null);
            return null;
        }

        if (tradeValue > availableTradeWalletBalance) {
            setPanelError("Trade amount cannot be greater than selected LP trade balance.");
            setCalculation(null);
            return null;
        }

        const pnlAmount = (tradeValue * marginPercent) / 100;
        const tradeResultBalance =
            type === "profit" ? tradeValue + pnlAmount : Math.max(tradeValue - pnlAmount, 0);
        const oldRestWalletBalance = Math.max(availableTradeWalletBalance - tradeValue, 0);
        const currentBalance = tradeResultBalance + oldRestWalletBalance;

        setPanelError("");
        const nextCalculation: CalculationSummary = {
            lpName: selectedLpUser.fullName,
            tradePair: tradePair.toUpperCase(),
            tradeValue,
            marginPercent,
            pnlAmount,
            tradeResultBalance,
            oldRestWalletBalance,
            currentBalance,
            type,
        };

        setCalculation(nextCalculation);
        return nextCalculation;
    };

    const onClear = () => {
        setTradePair("");
        setAmount("");
        setPercentage("");
        setSetType("profit");
        setAmountError("");
        setPanelError("");
        setCalculation(null);
        setTradeSaveMessage("");
    };

    const onStoreTrade = async () => {
        const summary = runCalculation(setType);
        if (!summary || !selectedLpUser) {
            return;
        }

        setSavingTrade(true);
        setTradeSaveMessage("");

        try {
            await createAdminTradeLog({
                lpUserId: selectedLpUser.id,
                tradePair: summary.tradePair,
                tradeVal: summary.tradeValue,
                tradeType: summary.type,
                margin: summary.marginPercent,
            });

            setTradeSaveMessage("Trade stored successfully.");
            const users = await getAllLpUsers();
            setLpUsers(users);
            setTradeCurrentPage(1);
        } catch (error) {
            setPanelError(error instanceof Error ? error.message : "Failed to store trade data.");
            setTradeSaveMessage("");
        } finally {
            setSavingTrade(false);
        }
    };

    const onOpenAddPair = () => {
        setEditingPair(null);
        setPairDraft("");
        setPairError("");
        setShowPairModal(true);
    };

    const onEditPair = (pair: string) => {
        setEditingPair(pair);
        setPairDraft(pair);
        setPairError("");
    };

    const onSubmitPair = () => {
        const normalized = normalizeTradePair(pairDraft);

        if (!isValidTradePair(normalized)) {
            setPairError("Use format like ABC/XYZ in uppercase.");
            return;
        }

        const exists = tradePairs.some(
            (item) => item === normalized && (!editingPair || item !== editingPair)
        );

        if (exists) {
            setPairError("This trade pair already exists.");
            return;
        }

        setTradePairs((prev) => {
            if (!editingPair) {
                return [...prev, normalized];
            }

            return prev.map((item) => (item === editingPair ? normalized : item));
        });

        if (editingPair === tradePair) {
            setTradePair(normalized);
        }

        setEditingPair(null);
        setPairDraft("");
        setPairError("");
    };

    const onDeletePair = (pair: string) => {
        setTradePairs((prev) => prev.filter((item) => item !== pair));
        if (tradePair === pair) {
            setTradePair("");
        }
        if (editingPair === pair) {
            setEditingPair(null);
            setPairDraft("");
            setPairError("");
        }
    };

    return (
        <section className={styles.page}>
            <div className={styles.headingRow}>
                <h1 className={styles.heading}>
                    PROFIT &amp; LOSS DASHBOARD
                </h1>
                <button
                    type="button"
                    className={styles.bulkUploadButton}
                    onClick={() => router.push("/admin/wallets/pnl-uploads")}
                >
                    <Upload size={14} /> Bulk Upload
                </button>
            </div>

            <div className={styles.layout}>
                <aside className={styles.calculator}>
                    <h2 className={styles.calculatorTitle}>
                        TRADE CALCULATOR
                    </h2>

                    <div className={styles.buttonList}>
                        <select
                            className={styles.inputButton}
                            value={lpName}
                            onChange={(event) => setLpName(event.target.value)}
                        >
                            <option value="">SELECT LP NAME</option>
                            {loadingLpUsers ? (
                                <option value="" disabled>
                                    Loading LP users...
                                </option>
                            ) : (
                                lpUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.fullName}
                                    </option>
                                ))
                            )}
                        </select>

                        {selectedLpUser && (
                            <div className={styles.walletBalanceBox}>
                                <span>Trade Wallet Bal:</span>
                                <strong>{tradeWalletBalance}$</strong>
                            </div>
                        )}

                        <div className={styles.inputWithSuffix}>
                            <select
                                className={`${styles.inputButton} ${styles.inputWithSuffixField}`}
                                value={tradePair}
                                onChange={(event) => setTradePair(event.target.value)}
                            >
                                <option value="">SELECT TRADE PAIR</option>
                                {tradePairs.map((pair) => (
                                    <option key={pair} value={pair}>
                                        {pair}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                className={styles.suffixIconButton}
                                onClick={() => {
                                    setShowPairModal(true);
                                    setPairError("");
                                }}
                                aria-label="Manage trade pairs"
                            >
                                <Pencil size={14} />
                            </button>
                        </div>

                        <input
                            className={styles.inputButton}
                            type="number"
                            placeholder="ENTER TRADE AMOUNT"
                            value={amount}
                            onChange={onAmountChange}
                            min="0"
                            max={selectedLpUser ? availableTradeWalletBalance : undefined}
                            step="0.01"
                        />

                        {amountError && <p className={styles.amountError}>{amountError}</p>}

                        <input
                            className={styles.inputButton}
                            type="number"
                            placeholder="ENTER PERCENTAGE %"
                            value={percentage}
                            onChange={onPercentageChange}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className={styles.setTypeRow}>
                        <span className={styles.setTypeLabel}>SET TYPE :</span>
                        <button
                            type="button"
                            className={styles.profitButton}
                            onClick={() => runCalculation("profit")}
                        >
                            PROFIT
                        </button>
                        <button
                            type="button"
                            className={styles.lossButton}
                            onClick={() => runCalculation("loss")}
                        >
                            LOSS
                        </button>
                    </div>

                    {panelError && <p className={styles.panelError}>{panelError}</p>}

                    <input
                        className={styles.resultButton}
                        type="text"
                        value={calculation ? `${calculation.tradeResultBalance.toFixed(2)}$` : ""}
                        placeholder="0.00$"
                        readOnly
                    />

                    <div className={styles.breakupBox}>
                        <p>Trade Value : {calculation ? `${calculation.tradeValue.toFixed(2)}$` : "-"}</p>
                        <p>Margin : {calculation ? `${calculation.pnlAmount.toFixed(2)}$` : "-"}</p>
                        <p>
                            {calculation?.type === "loss" ? "Loss Bal" : "Profit Bal"} :{" "}
                            {calculation ? `${calculation.tradeResultBalance.toFixed(2)}$` : "-"}
                        </p>
                        <p>
                            Current Bal :{" "}
                            {calculation ? `${calculation.currentBalance.toFixed(2)}$` : "-"}
                        </p>
                    </div>

                    <div className={styles.actionRow}>
                        <button type="button" className={styles.clearButton} onClick={onClear}>
                            Clear
                        </button>
                        <button type="button" className={styles.updateButton} onClick={onStoreTrade} disabled={savingTrade}>
                            {savingTrade ? "Saving..." : "Update"}
                        </button>
                    </div>

                    {tradeSaveMessage && <p className={styles.saveSuccess}>{tradeSaveMessage}</p>}
                </aside>

                <section className={styles.tableCard}>
                    <div className={styles.tableHeaderRow}>
                        <h2 className={styles.tableTitle}>LP Wallet Overview</h2>
                        <span className={styles.tableCount}>{lpUsers.length} users</span>
                    </div>

                    <div className={styles.tableWrap}>
                        <table className={styles.lpTable}>
                            <thead>
                                <tr>
                                    <th>LP Name</th>
                                    <th>Trade Bal (Total)</th>
                                    <th>Main Bal</th>
                                    <th>Modify</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingLpUsers ? (
                                    <tr>
                                        <td colSpan={5} className={styles.tableFallback}>
                                            Loading LP users...
                                        </td>
                                    </tr>
                                ) : paginatedLpUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={styles.tableFallback}>
                                            No LP users found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedLpUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.fullName}</td>
                                            <td>{Number(user.tradeWalletBalance || 0).toFixed(2)}$</td>
                                            <td>{Number(user.mainWalletBalance || 0).toFixed(2)}$</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.modifyButton}
                                                    onClick={() => setLpName(user.id)}
                                                >
                                                    Modify
                                                </button>
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        user.status === "active"
                                                            ? styles.statusActive
                                                            : styles.statusInactive
                                                    }
                                                >
                                                    {user.status === "active" ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.paginationRow}>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            onClick={() => setLpCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={lpCurrentPage <= 1}
                        >
                            Prev
                        </button>
                        <span className={styles.pageInfo}>
                            Page {lpCurrentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            className={styles.paginationButton}
                            onClick={() => setLpCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={lpCurrentPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                </section>
            </div>

            <section className={styles.tradeHistoryCard}>
                <div className={styles.tableHeaderRow}>
                    <h2 className={styles.tableTitle}>Stored Trade Logs</h2>
                    <span className={styles.tableCount}>{tradeTotalCount} records</span>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.lpTable}>
                        <thead>
                            <tr>
                                <th>Sl ID</th>
                                <th>Trade ID</th>
                                <th>LP Name</th>
                                <th>Trade Date</th>
                                <th>Trade Time</th>
                                <th>Trade Pair</th>
                                <th>Trade Val</th>
                                <th>Trade Type</th>
                                <th>Margin</th>
                                <th>Profit/Loss</th>
                                <th>Old Trade Bal</th>
                                <th>Curr Trade Bal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingTradeLogs ? (
                                <tr>
                                    <td colSpan={12} className={styles.tableFallback}>
                                        Loading trade logs...
                                    </td>
                                </tr>
                            ) : tradeLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className={styles.tableFallback}>
                                        No trade logs stored yet.
                                    </td>
                                </tr>
                            ) : (
                                tradeLogs.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.sl_id}</td>
                                        <td>{item.trade_id}</td>
                                        <td>{item.LP_name}</td>
                                        <td>{item.trade_date}</td>
                                        <td>{item.trade_time}</td>
                                        <td>{item.trade_pair}</td>
                                        <td>{Number(item.trade_val || 0).toFixed(2)}$</td>
                                        <td>{item.trade_type.toUpperCase()}</td>
                                        <td>{Number(item.margin || 0).toFixed(2)}%</td>
                                        <td>
                                            <span
                                                className={
                                                    item.trade_type === "profit"
                                                        ? styles.pnlBadgeProfit
                                                        : styles.pnlBadgeLoss
                                                }
                                            >
                                                {item.trade_type === "profit" ? "+" : "-"}
                                                {Number(item.profit || 0).toFixed(2)}$
                                            </span>
                                        </td>
                                        <td>{Number(item.old_trade_bal || 0).toFixed(2)}$</td>
                                        <td>{Number(item.curr_trade_bal || 0).toFixed(2)}$</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.paginationRow}>
                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => setTradeCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={tradeCurrentPage <= 1}
                    >
                        Prev
                    </button>
                    <span className={styles.pageInfo}>
                        Page {tradeCurrentPage} / {tradeTotalPages}
                    </span>
                    <button
                        type="button"
                        className={styles.paginationButton}
                        onClick={() => setTradeCurrentPage((prev) => Math.min(prev + 1, tradeTotalPages))}
                        disabled={tradeCurrentPage >= tradeTotalPages}
                    >
                        Next
                    </button>
                </div>
            </section>

            {showPairModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalHeader}>
                            <h3>Manage Trade Pairs</h3>
                            <button
                                type="button"
                                className={styles.modalCloseButton}
                                onClick={() => {
                                    setShowPairModal(false);
                                    setEditingPair(null);
                                    setPairDraft("");
                                    setPairError("");
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.pairEditorRow}>
                                <input
                                    className={styles.inputButton}
                                    type="text"
                                    placeholder="ABC/XYZ"
                                    value={pairDraft}
                                    onChange={(event) => {
                                        setPairDraft(normalizeTradePair(event.target.value));
                                        setPairError("");
                                    }}
                                />
                                <button type="button" className={styles.updateButton} onClick={onSubmitPair}>
                                    {editingPair ? "Save" : "Add"}
                                </button>
                                <button type="button" className={styles.clearButton} onClick={onOpenAddPair}>
                                    New
                                </button>
                            </div>

                            {pairError && <p className={styles.panelError}>{pairError}</p>}

                            <div className={styles.pairList}>
                                {tradePairs.map((pair) => (
                                    <div key={pair} className={styles.pairListItem}>
                                        <span>{pair}</span>
                                        <div className={styles.pairListActions}>
                                            <button type="button" className={styles.modifyButton} onClick={() => onEditPair(pair)}>
                                                Edit
                                            </button>
                                            <button type="button" className={styles.lossButton} onClick={() => onDeletePair(pair)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}
