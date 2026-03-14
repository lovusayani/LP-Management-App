import fs from "fs";
import path from "path";

import dotenv from "dotenv";

const cwdEnvPath = path.resolve(process.cwd(), ".env");
const workspaceServerEnvPath = path.resolve(process.cwd(), "server/.env");

dotenv.config({
  path: fs.existsSync(cwdEnvPath) ? cwdEnvPath : workspaceServerEnvPath,
});

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024,
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminName: process.env.ADMIN_NAME || "System Admin",
  demoLpName: process.env.DEMO_LP_NAME || "Demo LP User",
  demoLpEmail: process.env.DEMO_LP_EMAIL || "lp.demo@example.com",
  demoLpPassword: process.env.DEMO_LP_PASSWORD || "Demo@12345",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

export const validateEnv = (): void => {
  const required = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
};
