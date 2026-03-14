import { NextFunction, Request, Response } from "express";

export const enforceKycSubmitted = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.kycSubmitted) {
    return res.status(403).json({
      message: "KYC submission required",
      code: "KYC_SUBMISSION_REQUIRED",
    });
  }
  next();
};

export const enforceKycApproved = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.kycStatus !== "approved") {
    return res.status(403).json({
      message: "KYC approval required",
      code: "KYC_APPROVAL_REQUIRED",
    });
  }
  next();
};
