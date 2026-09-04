import { Request, Response } from "express";
import ExcelJS from "exceljs";

import { asyncHandler } from "../utils/asyncHandler";
import { DATA_TABLES, DataTableDef, getDataTable } from "../utils/dataTables";

const RESET_CONFIRM_TEXT = "RESET";

export const listDataTables = asyncHandler(async (_req: Request, res: Response) => {
  const tables = await Promise.all(
    DATA_TABLES.map(async (table) => ({
      key: table.key,
      label: table.label,
      count: await table.model.countDocuments(table.filter || {}),
    }))
  );

  return res.json({ tables });
});

const sanitizeValue = (value: unknown): string | number | boolean | Date => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object") {
    if (typeof (value as { toHexString?: unknown }).toHexString === "function") {
      return String(value);
    }
    return JSON.stringify(value);
  }

  return value as string | number | boolean;
};

const addTableSheet = async (workbook: ExcelJS.Workbook, table: DataTableDef): Promise<void> => {
  const sheet = workbook.addWorksheet(table.label.slice(0, 31));
  const records = await table.model.find(table.filter || {}).lean();
  const exclude = new Set(table.excludeFields);

  const columns: string[] = [];
  const seen = new Set<string>();
  records.forEach((record) => {
    Object.keys(record as Record<string, unknown>).forEach((key) => {
      if (!exclude.has(key) && !seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    });
  });

  sheet.columns = columns.map((key) => ({ header: key, key, width: 22 }));
  sheet.getRow(1).font = { bold: true };

  records.forEach((record) => {
    const row: Record<string, unknown> = {};
    columns.forEach((key) => {
      row[key] = sanitizeValue((record as Record<string, unknown>)[key]);
    });
    sheet.addRow(row);
  });
};

export const exportData = asyncHandler(async (req: Request, res: Response) => {
  const tablesParam = String(req.query.tables || "all").trim();
  const requestedKeys =
    tablesParam === "all" || tablesParam === ""
      ? DATA_TABLES.map((table) => table.key)
      : tablesParam.split(",").map((key) => key.trim()).filter(Boolean);

  const tables = requestedKeys
    .map((key) => getDataTable(key))
    .filter((table): table is DataTableDef => Boolean(table));

  if (tables.length === 0) {
    res.status(400);
    throw new Error("No valid tables selected for export");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LP Management Admin";
  workbook.created = new Date();

  for (const table of tables) {
    await addTableSheet(workbook, table);
  }

  const fileName = `lp-data-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await workbook.xlsx.write(res);
  res.end();
});

export const resetData = asyncHandler(async (req: Request, res: Response) => {
  const requestedKeys = Array.isArray(req.body.tables) ? (req.body.tables as unknown[]) : [];
  const confirmText = String(req.body.confirmText || "").trim();

  if (confirmText !== RESET_CONFIRM_TEXT) {
    res.status(400);
    throw new Error(`Type "${RESET_CONFIRM_TEXT}" to confirm this action`);
  }

  if (requestedKeys.length === 0) {
    res.status(400);
    throw new Error("Select at least one table to reset");
  }

  const tables: DataTableDef[] = [];
  for (const key of requestedKeys) {
    const table = getDataTable(String(key));
    if (!table) {
      res.status(400);
      throw new Error(`Unknown table: ${String(key)}`);
    }
    tables.push(table);
  }

  const results = [];
  for (const table of tables) {
    const result = await table.model.deleteMany(table.filter || {});
    results.push({
      key: table.key,
      label: table.label,
      deletedCount: result.deletedCount || 0,
    });
  }

  return res.json({ message: "Selected data has been reset", results });
});
