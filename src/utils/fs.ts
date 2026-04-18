import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

/**
 * Root of CENTRAL's user-level config (~/.central).
 * Read lazily so that `CENTRAL_HOME` env changes (e.g. in tests) take effect
 * without re-importing this module.
 */
export function getCentralHome(): string {
  const env = process.env.CENTRAL_HOME;
  if (env && env.trim().length > 0) return env;
  return path.join(os.homedir(), ".central");
}

/** Path to the user registry file. */
export function getUserRegistryPath(): string {
  return path.join(getCentralHome(), "registry.json");
}

/** Ensure the CENTRAL home directory exists. */
export async function ensureCentralHome(): Promise<void> {
  await fs.ensureDir(getCentralHome());
}

/** Safely read a JSON file, returning undefined when the file does not exist. */
export async function readJsonSafe<T = unknown>(filePath: string): Promise<T | undefined> {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) return undefined;
    return (await fs.readJson(filePath)) as T;
  } catch (err) {
    throw new Error(
      `Failed to read JSON at ${filePath}: ${(err as Error).message}`
    );
  }
}

/** Atomically write a JSON file, creating parent directories as needed. */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}
