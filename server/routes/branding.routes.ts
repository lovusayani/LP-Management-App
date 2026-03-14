import { Router } from "express";

import { getBrandingAssets } from "../controllers/admin.controller";

const router = Router();

router.get("/logos", getBrandingAssets);

export default router;