import { Router } from "express";
import { body } from "express-validator";

import {
  changePassword,
  login,
  logout,
  me,
  refresh,
} from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";

const router = Router();

router.get("/login", (_req, res) => {
  return res.status(405).json({
    message: "Use POST /api/auth/login with email and password.",
  });
});

router.post(
  "/login",
  [body("email").isEmail(), body("password").isString().isLength({ min: 8 })],
  validateRequest,
  login
);

router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, me);
router.post(
  "/change-password",
  protect,
  [
    body("currentPassword").isString().isLength({ min: 8 }),
    body("newPassword").isString().isLength({ min: 8 }),
  ],
  validateRequest,
  changePassword
);

export default router;
