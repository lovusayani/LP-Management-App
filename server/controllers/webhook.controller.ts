import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { sendTelegramMessage } from "../services/telegram.service";

const execAsync = promisify(exec);

const formatDeployMessage = (status: string, branch: string, commit: string, time: string, errorMessage?: string) => {
  const lines = [
    status,
    `Time: ${time}`,
    `Branch: ${branch}`,
    `Commit: ${commit}`,
  ];

  if (errorMessage) {
    lines.push(`Error: ${errorMessage}`);
  }

  return lines.join("\n");
};

export const deployWebhook = asyncHandler(async (req: Request, res: Response) => {
  const branch = String(req.body.branch || process.env.GIT_BRANCH || "unknown branch");
  const commit = String(req.body.commit || process.env.GIT_COMMIT || "unknown commit");
  const startedAt = new Date().toISOString();

  await sendTelegramMessage(
    formatDeployMessage("🚀 Deploy Started for Curreex", branch, commit, startedAt)
  );

  const projectRoot = path.resolve(__dirname, "../../");

  try {
    const deployCommand = "./deploy.sh";
    const { stdout, stderr } = await execAsync(deployCommand, {
      cwd: projectRoot,
      env: process.env,
      timeout: 30 * 60 * 1000,
    });

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  } catch (error) {
    const failedAt = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    await sendTelegramMessage(
      formatDeployMessage("❌ Deploy Failed for Curreex", branch, commit, failedAt, errorMessage)
    );

    return res.status(500).json({
      message: "Deploy failed",
      error: errorMessage,
    });
  }

  try {
    await execAsync("pm2 restart webhook", {
      cwd: process.cwd(),
      env: process.env,
      timeout: 2 * 60 * 1000,
    });
  } catch (pm2Error) {
    console.warn("PM2 restart webhook failed:", pm2Error);
  }

  const successAt = new Date().toISOString();
  await sendTelegramMessage(
    formatDeployMessage("✅ Deploy Successful for Curreex", branch, commit, successAt)
  );

  return res.json({ message: "Deploy finished" });
});
