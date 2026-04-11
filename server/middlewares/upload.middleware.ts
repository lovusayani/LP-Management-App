import multer from "multer";
import path from "path";

import { env } from "../config/env";
import { storageService } from "../services/storage.service";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

storageService.ensureStoragePath();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), env.uploadDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = file.fieldname.replace(/[^a-zA-Z0-9_-]/g, "");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${name}-${unique}${ext}`);
  },
});

export const kycUpload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only image and PDF files are allowed"));
    }
    cb(null, true);
  },
});

export const pdfUpload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

export const pngUpload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    const isPng = file.mimetype === "image/png" || path.extname(file.originalname).toLowerCase() === ".png";
    if (!isPng) {
      return cb(new Error("Only PNG files are allowed"));
    }
    cb(null, true);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: env.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (!isImage) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});
