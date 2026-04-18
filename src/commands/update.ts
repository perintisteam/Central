import chalk from "chalk";
import { Command } from "commander";
import { createSpinner } from "../ui/spinner.js";

export interface CreateUpdateCommandOptions {
  currentVersion: string;
  packageName?: string;
}

export function createUpdateCommand({
  currentVersion,
  packageName = "central",
}: CreateUpdateCommandOptions): Command {
  return new Command("update")
    .description("Check for updates to CENTRAL itself")
    .action(async () => {
      const spinner = createSpinner(
        `Checking npm for newer ${packageName}…`
      ).start();

      try {
        const latest = await fetchLatestVersion(packageName);
        spinner.stop();

        if (!latest) {
          console.log(
            chalk.yellow(
              "Could not determine the latest version from the npm registry."
            )
          );
          return;
        }

        if (latest === currentVersion) {
          console.log(
            chalk.green(`You're on the latest version (${currentVersion}).`)
          );
          return;
        }

        if (isNewer(latest, currentVersion)) {
          console.log(
            `Update available: ${chalk.dim(currentVersion)} → ${chalk.green.bold(latest)}`
          );
          console.log(
            `Run ${chalk.cyan(`npm i -g ${packageName}@latest`)} to upgrade.`
          );
        } else {
          console.log(
            chalk.dim(
              `Local version (${currentVersion}) is ahead of the published ${latest}.`
            )
          );
        }
      } catch (err) {
        spinner.fail("Update check failed.");
        console.error(chalk.red((err as Error).message));
      }
    });
}

async function fetchLatestVersion(pkg: string): Promise<string | null> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`npm registry responded with ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { version?: unknown };
  return typeof body.version === "string" ? body.version : null;
}

/** Minimal semver compare: returns true iff a > b. */
function isNewer(a: string, b: string): boolean {
  const parse = (v: string) =>
    v
      .replace(/^v/, "")
      .split(/[-+]/)[0]
      ?.split(".")
      .map((n) => Number.parseInt(n, 10)) ?? [];
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return false;
}
