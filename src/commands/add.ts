import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import { Command } from "commander";
import * as p from "@clack/prompts";
import { frameworkSchema, type Framework } from "../schemas/framework.schema.js";
import { saveFrameworkToUserRegistry } from "../core/registry.js";
import { getUserRegistryPath } from "../utils/fs.js";
import {
  buildFramework,
  inferInstallType,
  referencesProjectName,
} from "../core/framework-builder.js";

type Category = Framework["category"];
type InstallType = Framework["install"]["type"];

interface AddOptions {
  id?: string;
  name?: string;
  description?: string;
  category?: Category;
  command?: string;
  type?: InstallType;
  tags?: string;
  docs?: string;
  projectPrompt?: boolean;
  yes?: boolean;
}

export function createAddCommand(): Command {
  return new Command("add")
    .description(
      "Register a new framework. Pass a JSON file, use flags, or run with no args for an interactive prompt."
    )
    .argument("[file]", "optional path to a framework JSON definition")
    .option("--id <id>", "framework id (slug)")
    .option("--name <name>", "display name")
    .option("--description <text>", "one-line description")
    .option(
      "--category <category>",
      "category: fullstack | backend | frontend | meta"
    )
    .option(
      "--command <command>",
      'install command (e.g. "npx create-my-app {{projectName}}")'
    )
    .option("--type <type>", "install type: npx | npm | custom (auto-inferred if omitted)")
    .option("--tags <csv>", "comma-separated tags")
    .option("--docs <url>", "docs URL")
    .option("--no-project-prompt", "skip auto-adding a {{projectName}} prompt")
    .option("-y, --yes", "skip the confirmation prompt")
    .addHelpText(
      "after",
      `\nExamples:\n  ${chalk.cyan("$ central add")}                          interactive mode\n  ${chalk.cyan("$ central add ./my-fw.json")}            from a JSON file\n  ${chalk.cyan(
        '$ central add --id foo --name Foo \\\n      --command "npx create-foo@latest {{projectName}}" \\\n      --category frontend'
      )}\n`
    )
    .action(async (fileArg: string | undefined, opts: AddOptions) => {
      if (fileArg) {
        await addFromFile(fileArg);
        return;
      }

      if (hasAnyFlag(opts)) {
        await addFromFlags(opts);
        return;
      }

      await addInteractive(opts.yes ?? false);
    });
}

function hasAnyFlag(opts: AddOptions): boolean {
  return Boolean(
    opts.id ||
      opts.name ||
      opts.description ||
      opts.category ||
      opts.command ||
      opts.type ||
      opts.tags ||
      opts.docs
  );
}

// ─── Mode 1: file ───────────────────────────────────────────────────────────

async function addFromFile(fileArg: string): Promise<void> {
  const filePath = path.resolve(process.cwd(), fileArg);

  if (!(await fs.pathExists(filePath))) {
    console.error(chalk.red(`File not found: ${filePath}`));
    process.exitCode = 1;
    return;
  }

  let raw: unknown;
  try {
    raw = await fs.readJson(filePath);
  } catch (err) {
    console.error(
      chalk.red(`Failed to parse JSON at ${filePath}: ${(err as Error).message}`)
    );
    process.exitCode = 1;
    return;
  }

  const parsed = frameworkSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(chalk.red("Invalid framework definition:"));
    for (const issue of parsed.error.issues) {
      console.error(
        chalk.red(`  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      );
    }
    process.exitCode = 1;
    return;
  }

  await persist(parsed.data);
}

// ─── Mode 2: flags ──────────────────────────────────────────────────────────

async function addFromFlags(opts: AddOptions): Promise<void> {
  if (opts.category && !isCategory(opts.category)) {
    console.error(
      chalk.red(
        `Invalid --category "${opts.category}". Use one of: fullstack, backend, frontend, meta.`
      )
    );
    process.exitCode = 1;
    return;
  }
  if (opts.type && !isInstallType(opts.type)) {
    console.error(
      chalk.red(`Invalid --type "${opts.type}". Use one of: npx, npm, custom.`)
    );
    process.exitCode = 1;
    return;
  }

  if (!opts.id) {
    console.error(chalk.red("--id is required in flag mode."));
    process.exitCode = 1;
    return;
  }
  if (!opts.command) {
    console.error(chalk.red("--command is required in flag mode."));
    process.exitCode = 1;
    return;
  }

  const result = buildFramework({
    id: opts.id,
    name: opts.name,
    description: opts.description,
    category: opts.category,
    tags: opts.tags,
    docs: opts.docs,
    command: opts.command,
    type: opts.type,
    autoProjectNamePrompt: opts.projectPrompt !== false,
  });

  if (!result.ok) {
    console.error(chalk.red("Invalid framework definition:"));
    for (const i of result.issues) console.error(chalk.red(`  • ${i}`));
    process.exitCode = 1;
    return;
  }

  await persist(result.framework);
}

// ─── Mode 3: interactive ────────────────────────────────────────────────────

async function addInteractive(skipConfirm: boolean): Promise<void> {
  p.intro(chalk.bgCyan.black(" central add "));
  console.log(
    chalk.dim("Tell CENTRAL about your framework. Press Ctrl+C to abort.\n")
  );

  const id = await p.text({
    message: "Framework id / username (slug, e.g. `my-stack`)",
    placeholder: "my-stack",
    validate: (value) => {
      const v = value?.trim() ?? "";
      if (!v) return "id is required";
      if (!/^[a-z0-9][a-z0-9-_]*$/i.test(v))
        return "only letters, numbers, '-' and '_' are allowed";
      return undefined;
    },
  });
  cancelIfNeeded(id);

  const name = await p.text({
    message: "Display name",
    placeholder: String(id),
    initialValue: String(id),
  });
  cancelIfNeeded(name);

  const description = await p.text({
    message: "One-line description",
    placeholder: "A shiny new framework",
  });
  cancelIfNeeded(description);

  const category = (await p.select({
    message: "Category",
    options: [
      { value: "fullstack", label: "fullstack" },
      { value: "backend", label: "backend" },
      { value: "frontend", label: "frontend" },
      { value: "meta", label: "meta" },
    ],
    initialValue: "frontend",
  })) as Category;
  cancelIfNeeded(category);

  const command = await p.text({
    message: "Install command",
    placeholder: "npx create-my-app@latest {{projectName}}",
    validate: (value) => {
      if (!value || value.trim().length === 0) return "install command is required";
      return undefined;
    },
  });
  cancelIfNeeded(command);

  const inferredType = inferInstallType(String(command));
  const type = (await p.select({
    message: "Install type",
    options: [
      { value: "npx", label: "npx", hint: "wraps `npx <command>`" },
      { value: "npm", label: "npm", hint: "e.g. `npm create ...`" },
      { value: "custom", label: "custom", hint: "any other shell command" },
    ],
    initialValue: inferredType,
  })) as InstallType;
  cancelIfNeeded(type);

  const tagsInput = await p.text({
    message: "Tags (comma-separated, optional)",
    placeholder: "react, ssr, edge",
  });
  cancelIfNeeded(tagsInput);

  const docs = await p.text({
    message: "Docs URL (optional)",
    placeholder: "https://example.com/docs",
    validate: (value) => {
      if (!value) return undefined;
      try {
        new URL(value);
        return undefined;
      } catch {
        return "must be a valid URL";
      }
    },
  });
  cancelIfNeeded(docs);

  let autoPrompt = true;
  if (referencesProjectName(String(command))) {
    const ans = await p.confirm({
      message:
        "Your command uses {{projectName}} — add a required text prompt for it?",
      initialValue: true,
    });
    cancelIfNeeded(ans);
    autoPrompt = Boolean(ans);
  }

  const result = buildFramework({
    id: String(id),
    name: String(name) || String(id),
    description: String(description) || undefined,
    category,
    tags: String(tagsInput) || undefined,
    docs: String(docs) || undefined,
    command: String(command),
    type,
    autoProjectNamePrompt: autoPrompt,
  });

  if (!result.ok) {
    p.cancel("Validation failed:");
    for (const i of result.issues) console.error(chalk.red(`  • ${i}`));
    process.exitCode = 1;
    return;
  }

  p.note(previewFramework(result.framework), "Preview");

  if (!skipConfirm) {
    const ok = await p.confirm({
      message: `Save "${result.framework.name}" to the user registry?`,
      initialValue: true,
    });
    if (p.isCancel(ok) || ok === false) {
      p.cancel("Aborted.");
      return;
    }
  }

  p.outro(chalk.dim("Saving…"));
  await persist(result.framework);
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function persist(framework: Framework): Promise<void> {
  try {
    await saveFrameworkToUserRegistry(framework);
  } catch (err) {
    console.error(
      chalk.red(`Failed to save framework: ${(err as Error).message}`)
    );
    process.exitCode = 1;
    return;
  }

  console.log();
  console.log(
    chalk.green.bold(`✔ Registered "${framework.name}" (${framework.id})`)
  );
  console.log(chalk.dim(`  saved to ${getUserRegistryPath()}`));
  console.log();
  console.log(`Run ${chalk.cyan(`central install ${framework.id}`)} to use it.`);
}

function previewFramework(f: Framework): string {
  const lines = [
    `${chalk.bold("id")}:          ${f.id}`,
    `${chalk.bold("name")}:        ${f.name}`,
    `${chalk.bold("description")}: ${f.description}`,
    `${chalk.bold("category")}:    ${f.category}`,
    `${chalk.bold("tags")}:        ${f.tags.length ? f.tags.join(", ") : chalk.dim("(none)")}`,
    `${chalk.bold("install")}:     ${f.install.type}  ${chalk.cyan(f.install.command)}`,
  ];
  if (f.docs) lines.push(`${chalk.bold("docs")}:        ${f.docs}`);
  if (f.prompts && f.prompts.length > 0) {
    lines.push(
      `${chalk.bold("prompts")}:     ${f.prompts.map((p) => p.id).join(", ")}`
    );
  }
  return lines.join("\n");
}

function isCategory(value: string): value is Category {
  return ["fullstack", "backend", "frontend", "meta"].includes(value);
}

function isInstallType(value: string): value is InstallType {
  return ["npx", "npm", "custom"].includes(value);
}

function cancelIfNeeded(value: unknown): void {
  if (p.isCancel(value)) {
    p.cancel("Aborted.");
    process.exit(0);
  }
}
