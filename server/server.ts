import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import { connectDB } from "./config/db";
import { env, validateEnv } from "./config/env";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import { User } from "./models/User";
import routes from "./routes";

const ensureAdmin = async (): Promise<void> => {
  if (!env.adminEmail || !env.adminPassword) {
    return;
  }

  const existingAdmin = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (existingAdmin) {
    return;
  }

  await User.create({
    fullName: env.adminName,
    email: env.adminEmail.toLowerCase(),
    password: env.adminPassword,
    role: "admin",
    mustChangePassword: false,
    onboardingCompleted: true,
    kycSubmitted: true,
    kycStatus: "approved",
  });

  console.log("Default admin created");
};

const ensureDemoLp = async (): Promise<void> => {
  if (!env.demoLpEmail || !env.demoLpPassword) {
    return;
  }

  const existingLp = await User.findOne({ email: env.demoLpEmail.toLowerCase() });
  if (existingLp) {
    return;
  }

  await User.create({
    fullName: env.demoLpName,
    email: env.demoLpEmail.toLowerCase(),
    password: env.demoLpPassword,
    role: "lp",
    mustChangePassword: true,
    onboardingCompleted: false,
    kycSubmitted: false,
    kycStatus: "not_submitted",
  });

  console.log("Default demo LP created");
};

const bootstrap = async () => {
  validateEnv();
  await connectDB();
  await ensureAdmin();
  await ensureDemoLp();

  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        const allowed =
          origin === env.clientUrl ||
          /^http:\/\/localhost:\d+$/.test(origin) ||
          /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
          /^http:\/\/10\.0\.2\.2:\d+$/.test(origin) ||
          /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin);

        if (allowed) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    })
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
    skip: (req) => req.path === "/me" || req.path === "/refresh" || req.path === "/logout",
  });

  app.use("/api/auth", authRateLimit);
  app.use("/uploads", express.static(path.join(process.cwd(), env.uploadDir)));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", routes);
  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
