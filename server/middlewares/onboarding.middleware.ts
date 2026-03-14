import { NextFunction, Request, Response } from "express";

export const enforceOnboarding = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.onboardingCompleted) {
    return res.status(403).json({
      message: "Onboarding not completed",
      code: "ONBOARDING_REQUIRED",
    });
  }
  next();
};
