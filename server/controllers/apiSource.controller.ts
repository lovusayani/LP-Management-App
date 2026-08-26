import { Request, Response } from "express";

import { ApiSource } from "../models/ApiSource";
import { asyncHandler } from "../utils/asyncHandler";

const maskKey = (key: string) => (key.length <= 4 ? "••••" : `••••${key.slice(-4)}`);

const toRecord = (doc: {
  _id: unknown;
  name: string;
  baseUrl: string;
  apiKey: string;
  authHeader: string;
  isActive: boolean;
  assignedUsers: unknown[];
  createdAt?: Date;
}) => ({
  id: String(doc._id),
  name: doc.name,
  baseUrl: doc.baseUrl,
  apiKeyMasked: maskKey(doc.apiKey),
  authHeader: doc.authHeader,
  isActive: doc.isActive,
  assignedUsers: (doc.assignedUsers as { _id: unknown; fullName: string; email: string }[]).map((u) => ({
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
  })),
  createdAt: doc.createdAt,
});

export const listApiSources = asyncHandler(async (_req: Request, res: Response) => {
  const sources = await ApiSource.find().populate("assignedUsers", "fullName email").sort({ createdAt: -1 }).lean();
  return res.json(sources.map(toRecord));
});

export const createApiSource = asyncHandler(async (req: Request, res: Response) => {
  const { name, baseUrl, apiKey, authHeader } = req.body as {
    name: string;
    baseUrl: string;
    apiKey: string;
    authHeader?: "x-api-key" | "bearer";
  };

  const source = await ApiSource.create({
    name,
    baseUrl,
    apiKey,
    authHeader: authHeader || "x-api-key",
    assignedUsers: [],
  });

  return res.status(201).json(toRecord({ ...source.toObject(), assignedUsers: [] }));
});

export const updateApiSource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, baseUrl, apiKey, authHeader, isActive } = req.body as {
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    authHeader?: "x-api-key" | "bearer";
    isActive?: boolean;
  };

  const source = await ApiSource.findById(id);
  if (!source) {
    res.status(404);
    throw new Error("API source not found");
  }

  if (name !== undefined) source.name = name;
  if (baseUrl !== undefined) source.baseUrl = baseUrl;
  if (apiKey !== undefined && apiKey.trim() !== "") source.apiKey = apiKey;
  if (authHeader !== undefined) source.authHeader = authHeader;
  if (isActive !== undefined) source.isActive = isActive;

  await source.save();
  await source.populate("assignedUsers", "fullName email");

  return res.json(toRecord(source.toObject()));
});

export const deleteApiSource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const source = await ApiSource.findByIdAndDelete(id);
  if (!source) {
    res.status(404);
    throw new Error("API source not found");
  }
  return res.json({ message: "API source deleted" });
});

export const setApiSourceUsers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userIds } = req.body as { userIds: string[] };

  const source = await ApiSource.findById(id);
  if (!source) {
    res.status(404);
    throw new Error("API source not found");
  }

  source.assignedUsers = userIds as unknown as typeof source.assignedUsers;
  await source.save();
  await source.populate("assignedUsers", "fullName email");

  return res.json(toRecord(source.toObject()));
});
