import { Router } from "express";
import { body, param } from "express-validator";

import {
  completeOnboarding,
  getMyTradeLogs,
  getProfile,
  getPushNotificationStatus,
  getSettings,
  registerPushToken,
  sendMyTestPush,
  submitKyc,
  transactionAccess,
  unregisterPushToken,
  updateProfile,
  updateSettings,
  uploadProfileAvatar,
} from "../controllers/user.controller";
import { downloadPnlUpload, getPaymentSetup, getPublicPageContent, listPnlUploads } from "../controllers/admin.controller";
import { createDeposite, getDepositeHistory } from "../controllers/deposite.controller";
import {
  createWithdraw,
  getWithdrawHistory,
  getWithdrawWallet,
  saveWithdrawWallet,
} from "../controllers/withdraw.controller";
import {
  getWalletBalances,
  getWalletSwapHistory,
  swapWalletBalance,
} from "../controllers/wallet.controller";
import { protect } from "../middlewares/auth.middleware";
import { enforceKycApproved } from "../middlewares/kyc.middleware";
import { enforceOnboarding } from "../middlewares/onboarding.middleware";
import { kycUpload } from "../middlewares/upload.middleware";
import { validateRequest } from "../middlewares/validate.middleware";

const router = Router();

router.use(protect);

router.post("/onboarding/complete", completeOnboarding);

router.post(
  "/kyc",
  kycUpload.fields([
    { name: "companyProof", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  submitKyc
);

router.post("/deposite", kycUpload.single("screenshot"), createDeposite);
router.get("/deposite-history", getDepositeHistory);
router.get("/payment-setup", getPaymentSetup);
router.get("/withdraw/wallet", getWithdrawWallet);
router.post(
  "/withdraw/wallet",
  [
    body("walletAddress").isString().trim().isLength({ min: 8, max: 200 }),
    body("chainType")
      .isString()
      .trim()
      .customSanitizer((value) => String(value).toUpperCase())
      .isIn(["TRC20", "ERC20", "BEP20"]),
    body("currency")
      .isString()
      .trim()
      .customSanitizer((value) => String(value).toUpperCase())
      .isIn(["USDT", "USD", "INR"]),
  ],
  validateRequest,
  saveWithdrawWallet
);
router.post(
  "/withdraw",
  [body("amount").isFloat({ gt: 0 })],
  validateRequest,
  createWithdraw
);
router.get("/withdraw/history", getWithdrawHistory);
router.get("/wallet/balances", getWalletBalances);
router.get("/wallet/swap-history", getWalletSwapHistory);
router.get("/trades", getMyTradeLogs);
router.post(
  "/wallet/swap",
  [
    body("direction").isString().isIn(["main_to_trade", "trade_to_main"]),
    body("amount").isFloat({ gt: 0 }),
  ],
  validateRequest,
  swapWalletBalance
);

router.get("/profile", getProfile);
router.put(
  "/profile",
  [
    body("fullName").optional().isString().trim().isLength({ min: 2, max: 80 }),
    body("phone").optional({ nullable: true }).isString().trim().isLength({ max: 32 }),
  ],
  validateRequest,
  updateProfile
);
router.post("/profile/avatar", kycUpload.single("avatar"), uploadProfileAvatar);
router.get("/push/status", getPushNotificationStatus);
router.post(
  "/push/register",
  [body("token").isString().trim().isLength({ min: 20 })],
  validateRequest,
  registerPushToken
);
router.delete(
  "/push/unregister",
  [body("token").optional().isString().trim().isLength({ min: 20 })],
  validateRequest,
  unregisterPushToken
);
router.post(
  "/push/test",
  [
    body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
    body("body").optional().isString().trim().isLength({ min: 1, max: 240 }),
    body("url").optional().isString().trim().isLength({ min: 1, max: 200 }),
  ],
  validateRequest,
  sendMyTestPush
);
router.get("/settings", getSettings);
router.put(
  "/settings",
  [
    body("theme").optional().isIn(["light", "dark", "system"]),
    body("fontSize").optional().isInt({ min: 12, max: 22 }),
    body("notificationSound").optional().isBoolean(),
    body("alerts").optional().isBoolean(),
  ],
  validateRequest,
  updateSettings
);

router.get(
  "/transaction-access",
  enforceOnboarding,
  (req, res, next) => {
    if (req.user?.kycStatus !== "approved") {
      return res.status(403).json({ message: "KYC approval required" });
    }
    next();
  },
  enforceKycApproved,
  transactionAccess
);

router.get("/pnl-uploads", listPnlUploads);
router.get("/pnl-uploads/:id/download", [param("id").isMongoId()], validateRequest, downloadPnlUpload);
router.get("/page-content/:slug", getPublicPageContent);

export default router;
