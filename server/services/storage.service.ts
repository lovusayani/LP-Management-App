import fs from "fs";
import path from "path";

import { env } from "../config/env";

export interface FileStorageService {
  ensureStoragePath(): void;
  getRelativePath(filename: string): string;
}

class LocalStorageService implements FileStorageService {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  ensureStoragePath(): void {
    const absoluteDir = path.join(process.cwd(), this.baseDir);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
  }

  getRelativePath(filename: string): string {
    return path.join(this.baseDir, filename).replace(/\\/g, "/");
  }
}

export const storageService: FileStorageService = new LocalStorageService(env.uploadDir);
