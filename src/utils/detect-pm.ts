import fs from "fs-extra";
import path from "node:path";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

/**
 * Detect the package manager the user is currently running.
 *
 * Priority:
 *   1. npm_config_user_agent (set by npm/yarn/pnpm/bun themselves)
 *   2. Lockfiles in the current working directory
 *   3. Fallback: "npm"
 */
export async function detectPackageManager(cwd = process.cwd()): Promise<PackageManager> {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("bun")) return "bun";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("npm")) return "npm";

  const candidates: Array<[string, PackageManager]> = [
    ["bun.lockb", "bun"],
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
  ];

  for (const [file, pm] of candidates) {
    if (await fs.pathExists(path.join(cwd, file))) return pm;
  }

  return "npm";
}
