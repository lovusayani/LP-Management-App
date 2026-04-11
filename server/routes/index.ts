import { Router } from "express";

import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import brandingRoutes from "./branding.routes";
import userRoutes from "./user.routes";
import webhookRoutes from "./webhook.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/branding", brandingRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);
router.use("/webhook", webhookRoutes);

export default router;
