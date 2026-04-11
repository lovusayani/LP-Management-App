import { Router } from "express";
import { body, param } from "express-validator";

import {
  adjustLpMainBalance,
  changeUserStatus,
  createTradeLog,
  createLpUser,
  deletePnlUpload,
  getAllWithdrawRequests,
  getAdminPageContent,
  getAdminStats,
  getBrandingAssets,
  getNotificationOverview,
  getAllDeposites,
  getWithdrawWalletMethods,
  getDepositeById,
  getAllLpUsers,
  getAllTradeLogs,
  listPnlUploads,
  reviewWithdrawRequest,
  reviewDeposite,
  reviewKyc,
  sendPushToAllUsers,
  sendPushToSingleUser,
  setUserPushPreference,
  updateAdminPageContent,
  updateLpUserLockInBalance,
  updateLpUserPassword,
  uploadBrandingLogo,
  getPaymentSetup,
  updatePaymentSetup,
  uploadPaymentQr,
  deletePaymentQr,
  uploadPnlFiles,
} from "../controllers/admin.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorizeRole } from "../middlewares/role.middleware";
import { pdfUpload, pngUpload, imageUpload } from "../middlewares/upload.middleware";
import { validateRequest } from "../middlewares/validate.middleware";

const router = Router();

router.use(protect, authorizeRole("admin"));

router.post(
  "/users",
  [
    body("fullName").isString().isLength({ min: 2 }),
    body("email").isEmail(),
    body("password").isString().isLength({ min: 8 }),
    body("phone").optional().isString(),
  ],
  validateRequest,
  createLpUser
);

router.get("/stats", getAdminStats);
router.get("/branding/logos", getBrandingAssets);
router.get("/page-content/:slug", getAdminPageContent);
router.put(
  "/page-content/:slug",
  [param("slug").isString().isIn(["about", "help", "support", "faq"])],
  validateRequest,
  updateAdminPageContent
);
router.get("/users", getAllLpUsers);

router.patch(
  "/users/:id/kyc-status",
  [param("id").isMongoId(), body("kycStatus").isString()],
  validateRequest,
  reviewKyc
);

router.patch(
  "/users/:id/status",
  [param("id").isMongoId(), body("status").isString()],
  validateRequest,
  changeUserStatus
);

router.patch(
  "/users/:id/password",
  [param("id").isMongoId(), body("password").isString().isLength({ min: 8 })],
  validateRequest,
  updateLpUserPassword
);

router.patch(
  "/users/:id/lock-in-balance",
  [param("id").isMongoId(), body("lockInBalance").isFloat({ min: 0 })],
  validateRequest,
  updateLpUserLockInBalance
);

router.patch(
  "/users/:id/main-balance",
  [
    param("id").isMongoId(),
    body("action").isString().isIn(["credit", "debit"]),
    body("amount").isFloat({ gt: 0 }),
    body("category").isString().trim().isLength({ min: 1, max: 100 }),
    body("note").optional().isString().trim().isLength({ max: 300 }),
  ],
  validateRequest,
  adjustLpMainBalance
);

router.post(
  "/setup/logos/:variant",
  [param("variant").isString().isIn(["dark", "light", "mobile"])],
  validateRequest,
  pngUpload.single("logo"),
  uploadBrandingLogo
);

router.get("/payment-setup", getPaymentSetup);
router.patch("/payment-setup", updatePaymentSetup);
router.post(
  "/payment-setup/qr/:network",
  [param("network").isString().isIn(["TRC20", "ERC20", "BEP20"])],
  validateRequest,
  imageUpload.single("qrCode"),
  uploadPaymentQr
);
router.delete(
  "/payment-setup/qr/:network",
  [param("network").isString().isIn(["TRC20", "ERC20", "BEP20"])],
  validateRequest,
  deletePaymentQr
);

router.get("/notifications/overview", getNotificationOverview);

router.post(
  "/notifications/send-all",
  [
    body("title").optional().isString().isLength({ min: 1, max: 120 }),
    body("body").optional().isString().isLength({ min: 1, max: 500 }),
    body("url").optional().isString().isLength({ min: 1, max: 200 }),
  ],
  validateRequest,
  sendPushToAllUsers
);

router.post(
  "/notifications/users/:id/send",
  [
    param("id").isMongoId(),
    body("title").optional().isString().isLength({ min: 1, max: 120 }),
    body("body").optional().isString().isLength({ min: 1, max: 500 }),
    body("url").optional().isString().isLength({ min: 1, max: 200 }),
  ],
  validateRequest,
  sendPushToSingleUser
);

router.patch(
  "/notifications/users/:id/push-preference",
  [param("id").isMongoId(), body("enabled").isBoolean()],
  validateRequest,
  setUserPushPreference
);

router.post(
  "/trades",
  [
    body("lpUserId").isMongoId(),
    body("tradePair").isString().isLength({ min: 3 }),
    body("tradeVal").isFloat({ min: 0 }),
    body("tradeType").isString().isIn(["profit", "loss"]),
    body("margin").isFloat({ min: 0 }),
  ],
  validateRequest,
  createTradeLog
);

router.get("/trades", getAllTradeLogs);

router.get("/deposits", getAllDeposites);

router.get(
  "/deposits/:id",
  [param("id").isMongoId()],
  validateRequest,
  getDepositeById
);

router.patch(
  "/deposits/:id/status",
  [
    param("id").isMongoId(),
    body("status").isString().isIn(["approved", "rejected"]),
    body("adminRemark").optional().isString().isLength({ max: 500 }),
  ],
  validateRequest,
  reviewDeposite
);

router.get("/withdrawals/methods", getWithdrawWalletMethods);

router.get("/withdrawals/requests", getAllWithdrawRequests);

router.patch(
  "/withdrawals/:id/status",
  [
    param("id").isMongoId(),
    body("status").isString().isIn(["approved", "rejected"]),
    body("adminRemark").optional().isString().isLength({ max: 500 }),
  ],
  validateRequest,
  reviewWithdrawRequest
);

router.post("/pnl-uploads", pdfUpload.array("files", 20), uploadPnlFiles);
router.get("/pnl-uploads", listPnlUploads);
router.delete("/pnl-uploads/:id", [param("id").isMongoId()], validateRequest, deletePnlUpload);

export default router;
