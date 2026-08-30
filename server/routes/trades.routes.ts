import { Router } from "express";

import { getChargeSummary, getTrades, getWalletOverview } from "../controllers/trades.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", getTrades);
router.get("/charges/summary", getChargeSummary);
router.get("/wallet-overview", getWalletOverview);

export default router;
