import crypto from "crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { IUser } from "../models/User";

interface TokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"] }
  );
};

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"] }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
