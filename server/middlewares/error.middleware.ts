import { NextFunction, Request, Response } from "express";

export const notFound = (_req: Request, res: Response) => {
  return res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
};
