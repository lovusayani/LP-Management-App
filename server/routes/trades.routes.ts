import { Router } from "express";

import { getTrades } from "../controllers/trades.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", getTrades);

export default router;
