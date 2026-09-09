import { Request, Response } from "express";

import { Notice } from "../models/Notice";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";

// ─── Admin ─────────────────────────────────────────────────────────────────

export const createNotice = asyncHandler(async (req: Request, res: Response) => {
  const title = String(req.body.title || "").trim();
  const message = String(req.body.message || "").trim();
  const target = String(req.body.target || "") as "all" | "user";
  const userId = String(req.body.userId || "").trim();

  if (target === "user") {
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.role !== "lp") {
      res.status(404);
      throw new Error("Target user not found");
    }
  }

  const notice = await Notice.create({
    title,
    message,
    target,
    targetUser: target === "user" ? userId : undefined,
    createdBy: req.user?._id,
  });

  return res.status(201).json({
    message: "Notice sent",
    notice: {
      id: String(notice._id),
      title: notice.title,
      message: notice.message,
      target: notice.target,
      targetUser: notice.targetUser ? String(notice.targetUser) : null,
      createdAt: notice.createdAt,
    },
  });
});

export const listAdminNotices = asyncHandler(async (_req: Request, res: Response) => {
  const notices = await Notice.find()
    .populate("targetUser", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    notices: notices.map((item) => ({
      id: String(item._id),
      title: item.title,
      message: item.message,
      target: item.target,
      targetUser:
        item.targetUser && typeof item.targetUser === "object" && "fullName" in item.targetUser
          ? {
              id: String((item.targetUser as Record<string, unknown>)._id),
              fullName: String(item.targetUser.fullName || ""),
              email: String((item.targetUser as Record<string, unknown>).email || ""),
            }
          : null,
      readCount: (item.readBy || []).length,
      createdAt: item.createdAt,
    })),
  });
});

// ─── LP User ───────────────────────────────────────────────────────────────

export const listMyNotices = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const notices = await Notice.find({
    $or: [{ target: "all" }, { target: "user", targetUser: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    notices: notices.map((item) => ({
      id: String(item._id),
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
      read: (item.readBy || []).some((id) => String(id) === String(req.user!._id)),
    })),
  });
});

export const getMyNoticeById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const { id } = req.params;

  const notice = await Notice.findOne({
    _id: id,
    $or: [{ target: "all" }, { target: "user", targetUser: req.user._id }],
  });

  if (!notice) {
    res.status(404);
    throw new Error("Notice not found");
  }

  const alreadyRead = (notice.readBy || []).some((readerId) => String(readerId) === String(req.user!._id));
  if (!alreadyRead) {
    notice.readBy.push(req.user._id as never);
    await notice.save();
  }

  return res.json({
    notice: {
      id: String(notice._id),
      title: notice.title,
      message: notice.message,
      createdAt: notice.createdAt,
      read: true,
    },
  });
});
