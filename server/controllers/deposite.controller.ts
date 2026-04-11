import { Request, Response } from "express";

import { Deposite, DepositeNetwork, DepositeType } from "../models/Deposite";
import { PaymentSetup } from "../models/PaymentSetup";
import { storageService } from "../services/storage.service";
import { asyncHandler } from "../utils/asyncHandler";

const ON_CHAIN_ADDRESSES: Record<DepositeNetwork, string> = {
  TRC20: "TRx9mDemoWalletAddress88621",
  ERC20: "0xA91fDemoWalletAddress63D112Aa0",
  BEP20: "0xBep20DemoWalletAddress9f11c6f",
};

const ALLOWED_TYPES: DepositeType[] = ["on_chain", "f2f", "buy_crypto"];
const ALLOWED_NETWORKS: DepositeNetwork[] = ["TRC20", "ERC20", "BEP20"];

export const createDeposite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const rawAmount = Number(req.body.amount);
  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    res.status(400);
    throw new Error("Valid deposite amount is required");
  }

  const depositeType = String(req.body.depositeType || "on_chain") as DepositeType;
  if (!ALLOWED_TYPES.includes(depositeType)) {
    res.status(400);
    throw new Error("Invalid deposite type");
  }

  if (depositeType === "buy_crypto") {
    res.status(400);
    throw new Error("Buy Crypto deposite type is currently inactive");
  }

  const screenshotFile = req.file as Express.Multer.File | undefined;
  if (!screenshotFile) {
    res.status(400);
    throw new Error("Screenshot upload is required");
  }

  let network: DepositeNetwork | undefined;
  let walletAddress: string | undefined;

  if (depositeType === "on_chain") {
    const rawNetwork = String(req.body.network || "") as DepositeNetwork;
    if (!ALLOWED_NETWORKS.includes(rawNetwork)) {
      res.status(400);
      throw new Error("Deposite network is required for On Chain Deposit");
    }
    network = rawNetwork;

    const paymentSetup = await PaymentSetup.findOne({ key: "default" }).lean();
    walletAddress = paymentSetup?.networks?.[network]?.walletAddress?.trim() || ON_CHAIN_ADDRESSES[network];
  }

  const deposite = await Deposite.create({
    user: req.user._id,
    amount: rawAmount,
    depositeType,
    network,
    walletAddress,
    screenshot: storageService.getRelativePath(screenshotFile.filename),
    remarks: String(req.body.remarks || "").trim(),
    status: "pending",
  });

  return res.status(201).json({
    deposite: {
      id: deposite._id,
      amount: deposite.amount,
      depositeType: deposite.depositeType,
      network: deposite.network,
      walletAddress: deposite.walletAddress,
      screenshot: deposite.screenshot,
      remarks: deposite.remarks,
      status: deposite.status,
      createdAt: deposite.createdAt,
    },
  });
});

export const getDepositeHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const records = await Deposite.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return res.json({
    records: records.map((item) => ({
      id: item._id,
      amount: item.amount,
      depositeType: item.depositeType,
      network: item.network,
      walletAddress: item.walletAddress,
      screenshot: item.screenshot,
      remarks: item.remarks,
      status: item.status,
      createdAt: item.createdAt,
    })),
  });
});
