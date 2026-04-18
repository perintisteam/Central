import { execa, type ResultPromise } from "execa";
import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import type { Framework } from "../schemas/framework.schema.js";
import { createSpinner } from "../ui/spinner.js";

export type PromptAnswers = Record<string, string | boolean | undefined>;

export interface RunOptions {
  /** Working directory. Defaults to process.cwd(). */
  cwd?: string;
  /** Stream child-process stdio to the terminal. Default true so creators work interactively. */
  interactive?: boolean;
  /** Hide the spinner — useful when the install command itself is interactive. */
  hideSpinner?: boolean;
}

export interface RunResult {
  success: boolean;
  exitCode: number | null;
  command: string;
  durationMs: number;
}

/**
 * Resolve {{placeholder}} tokens inside a string using the provided answers.
 * Placeholders for which there is no answer are left intact (so downstream
 * scaffolds can detect missing data and fail loudly).
 */
export function interpolate(template: string, answers: PromptAnswers): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key: string) => {
    const val = answers[key];
    if (val === undefined || val === null || val === false) return "";
    return String(val);
  });
}

/** Remove empty tokens left over from optional placeholders. */
function normaliseCommand(command: string): string {
  return command.replace(/\s{2,}/g, " ").trim();
}

/**
 * Execute a framework's install command.
 * Interactive creators (create-next-app, create-astro, etc.) need a real TTY,
 * so we stream stdio through by default and only show the spinner for
 * non-interactive phases.
 */
export async function runFrameworkInstall(
  framework: Framework,
  answers: PromptAnswers,
  options: RunOptions = {}
): Promise<RunResult> {
  const { cwd = process.cwd(), interactive = true, hideSpinner = interactive } = options;

  const rawCommand = interpolate(framework.install.command, answers);
  const command = normaliseCommand(rawCommand);

  if (command.length === 0) {
    throw new Error(
      `Install command for "${framework.id}" resolved to an empty string — check its prompt placeholders.`
    );
  }

  if (framework.install.type === "custom" && command.startsWith("central:scaffold-express-ts")) {
    const projectName = String(answers["projectName"] ?? "").trim();
    if (!projectName) throw new Error("Project name is required for Express (TS) scaffold.");
    return scaffoldExpressTs(projectName, { cwd, hideSpinner });
  }

  const start = Date.now();
  const spinner = hideSpinner
    ? undefined
    : createSpinner(`Setting up ${framework.name}…`).start();

  try {
    const child = spawnShell(command, {
      cwd,
      stdio: interactive ? "inherit" : "pipe",
    });
    const result = await child;
    spinner?.succeed(`${framework.name} ready.`);
    return {
      success: true,
      exitCode: result.exitCode ?? 0,
      command,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    spinner?.fail(`${framework.name} install failed.`);
    const e = err as { exitCode?: number; shortMessage?: string; message?: string };
    throw new RunError(
      e.shortMessage ?? e.message ?? "Unknown install error",
      command,
      e.exitCode ?? null
    );
  }
}

export class RunError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly exitCode: number | null
  ) {
    super(message);
    this.name = "RunError";
  }
}

/**
 * Spawn a shell command cross-platform.
 * We use `shell: true` because many creator commands rely on shell
 * features (pipes, `&&`, `npm create` package resolution, etc.).
 */
function spawnShell(
  command: string,
  opts: { cwd: string; stdio: "inherit" | "pipe" }
): ResultPromise {
  return execa(command, {
    cwd: opts.cwd,
    stdio: opts.stdio,
    shell: true,
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? "1" },
    reject: true,
  });
}

/**
 * Custom scaffold for the "Express (TS)" entry.
 * Creates a minimal, runnable TypeScript Express server.
 */
async function scaffoldExpressTs(
  projectName: string,
  opts: { cwd: string; hideSpinner: boolean }
): Promise<RunResult> {
  const start = Date.now();
  const target = path.resolve(opts.cwd, projectName);
  const spinner = opts.hideSpinner
    ? undefined
    : createSpinner(`Scaffolding Express (TS) in ${chalk.cyan(projectName)}…`).start();

  try {
    if (await fs.pathExists(target)) {
      const entries = await fs.readdir(target);
      if (entries.length > 0) {
        throw new Error(
          `Target directory "${projectName}" already exists and is not empty.`
        );
      }
    }
    await fs.ensureDir(target);

    const pkg = {
      name: projectName,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "tsx watch src/index.ts",
        build: "tsc",
        start: "node dist/index.js",
      },
      dependencies: {
        express: "^4.21.2",
      },
      devDependencies: {
        "@types/express": "^5.0.0",
        "@types/node": "^22.10.5",
        tsx: "^4.19.2",
        typescript: "^5.7.3",
      },
    };

    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        outDir: "dist",
        rootDir: "src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ["src/**/*"],
    };

    const indexTs = `import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get("/", (_req, res) => {
  res.json({ message: "Hello from CENTRAL + Express + TypeScript!" });
});

app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});
`;

    const gitignore = "node_modules\ndist\n.env\n";
    const readme = `# ${projectName}

Scaffolded with [CENTRAL](https://www.npmjs.com/package/central).

## Quickstart

\`\`\`bash
npm install
npm run dev
\`\`\`
`;

    await fs.writeJson(path.join(target, "package.json"), pkg, { spaces: 2 });
    await fs.writeJson(path.join(target, "tsconfig.json"), tsconfig, { spaces: 2 });
    await fs.ensureDir(path.join(target, "src"));
    await fs.writeFile(path.join(target, "src", "index.ts"), indexTs);
    await fs.writeFile(path.join(target, ".gitignore"), gitignore);
    await fs.writeFile(path.join(target, "README.md"), readme);

    if (spinner) spinner.text = `Installing Express dependencies in ${chalk.cyan(projectName)}…`;

    await execa("npm", ["install"], {
      cwd: target,
      stdio: "pipe",
      shell: false,
    });

    spinner?.succeed(`Express (TS) ready in ${chalk.cyan(projectName)}/`);
    return {
      success: true,
      exitCode: 0,
      command: `central:scaffold-express-ts ${projectName}`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    spinner?.fail("Express (TS) scaffold failed.");
    const message = err instanceof Error ? err.message : String(err);
    throw new RunError(message, `central:scaffold-express-ts ${projectName}`, null);
  }
}
