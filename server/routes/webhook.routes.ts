import { Router } from "express";

import { deployWebhook } from "../controllers/webhook.controller";

const router = Router();

router.post("/deploy", deployWebhook);

export default router;
