import { Request, Response } from "express";

import { User } from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../services/token.service";
import { asyncHandler } from "../utils/asyncHandler";

const sanitizeUser = (user: any) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  mustChangePassword: user.mustChangePassword,
  onboardingCompleted: user.onboardingCompleted,
  kycSubmitted: user.kycSubmitted,
  kycStatus: user.kycStatus,
  kycDocuments: user.kycDocuments,
  settings: user.settings,
});

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  return res.json({
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingToken) {
    res.status(401);
    throw new Error("Refresh token required");
  }

  const decoded = verifyRefreshToken(incomingToken);
  const user = await User.findById(decoded.userId);

  if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(incomingToken)) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  return res.json({
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    req.user.refreshTokenHash = undefined;
    await req.user.save();
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  return res.json({ user: sanitizeUser(req.user) });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const { currentPassword, newPassword } = req.body;

  const isValid = await req.user.comparePassword(currentPassword);
  if (!isValid) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  req.user.password = newPassword;
  req.user.mustChangePassword = false;
  await req.user.save();

  return res.json({ message: "Password updated successfully" });
});
