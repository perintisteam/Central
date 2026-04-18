import * as p from "@clack/prompts";
import chalk from "chalk";
import { loadRegistry } from "../core/registry.js";
import type { Framework } from "../schemas/framework.schema.js";
import { printBanner } from "../ui/banner.js";
import { installFramework } from "./install.js";

type CategoryFilter = Framework["category"] | "all";

/**
 * Entry point for `central` with no arguments.
 * Step-by-step flow described in the spec.
 */
export async function runInteractive(version: string): Promise<void> {
  printBanner({ version });

  const { frameworks, warnings } = await loadRegistry();
  for (const w of warnings) console.error(chalk.yellow(`warn: ${w}`));

  if (frameworks.length === 0) {
    console.log(chalk.red("No frameworks registered — something is wrong with your install."));
    process.exitCode = 1;
    return;
  }

  p.intro(chalk.bgCyan.black(" CENTRAL "));

  const category = (await p.select({
    message: "What type of project do you want to build?",
    options: [
      { value: "all", label: "All frameworks" },
      { value: "fullstack", label: "Fullstack" },
      { value: "backend", label: "Backend" },
      { value: "frontend", label: "Frontend" },
      { value: "meta", label: "Meta-frameworks" },
    ],
    initialValue: "all",
  })) as CategoryFilter;

  if (p.isCancel(category)) {
    p.cancel("Goodbye.");
    return;
  }

  const filtered =
    category === "all" ? frameworks : frameworks.filter((f) => f.category === category);

  if (filtered.length === 0) {
    p.cancel(`No frameworks found in category "${category}".`);
    return;
  }

  const pickedId = await p.select({
    message: "Pick a framework",
    options: filtered.map((f) => ({
      value: f.id,
      label: f.name,
      hint: f.description,
    })),
  });

  if (p.isCancel(pickedId)) {
    p.cancel("Goodbye.");
    return;
  }

  const framework = filtered.find((f) => f.id === pickedId);
  if (!framework) {
    p.cancel(`Framework "${String(pickedId)}" disappeared.`);
    return;
  }

  p.note(
    [
      chalk.bold(framework.name),
      framework.description,
      framework.tags.length ? chalk.dim(`tags: ${framework.tags.join(", ")}`) : "",
      framework.docs ? chalk.dim(`docs: ${framework.docs}`) : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "Selected"
  );

  p.outro(chalk.dim("Running install flow…"));

  await installFramework(framework);
}
