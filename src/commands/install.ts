import chalk from "chalk";
import { Command } from "commander";
import { loadRegistry } from "../core/registry.js";
import { runPromptSteps } from "../core/prompt-engine.js";
import {
  RunError,
  interpolate,
  runFrameworkInstall,
  type PromptAnswers,
} from "../core/runner.js";
import type { Framework } from "../schemas/framework.schema.js";

export function createInstallCommand(): Command {
  return new Command("install")
    .alias("i")
    .description("Install a framework by id (e.g. `central install nextjs`)")
    .argument("<id>", "framework id as shown by `central list`")
    .option("-y, --yes", "Skip the confirmation prompt")
    .action(async (id: string, opts: { yes?: boolean }) => {
      const { frameworks, warnings } = await loadRegistry();
      for (const w of warnings) console.error(chalk.yellow(`warn: ${w}`));

      const framework = frameworks.find((f) => f.id === id);
      if (!framework) {
        console.error(chalk.red(`Framework "${id}" not found.`));
        console.error(
          chalk.dim(`Tip: run ${chalk.cyan("central list")} to see available ids.`)
        );
        process.exitCode = 1;
        return;
      }

      await installFramework(framework, { skipConfirm: opts.yes ?? false });
    });
}

export interface InstallOptions {
  skipConfirm?: boolean;
  preAnswers?: PromptAnswers;
}

/**
 * Shared install flow used by both `central install <id>` and interactive mode.
 * Prints a banner, runs prompts, executes the install, and reports next steps.
 */
export async function installFramework(
  framework: Framework,
  options: InstallOptions = {}
): Promise<boolean> {
  const { skipConfirm = false, preAnswers = {} } = options;

  console.log();
  console.log(chalk.bold.cyan(framework.name) + chalk.dim(`  (${framework.id})`));
  console.log(chalk.dim(framework.description));
  if (framework.tags.length > 0) {
    console.log(chalk.dim(`tags: ${framework.tags.join(", ")}`));
  }
  console.log();

  if (!skipConfirm) {
    const { confirm } = await import("@clack/prompts");
    const ok = await confirm({
      message: `Install ${framework.name}?`,
      initialValue: true,
    });
    const { isCancel, cancel } = await import("@clack/prompts");
    if (isCancel(ok) || ok === false) {
      cancel("Aborted.");
      return false;
    }
  }

  const promptAnswers = await runPromptSteps(framework.prompts);
  const answers: PromptAnswers = { ...preAnswers, ...promptAnswers };

  try {
    await runFrameworkInstall(framework, answers);
    printSuccess(framework, answers);
    return true;
  } catch (err) {
    printFailure(framework, err);
    process.exitCode = 1;
    return false;
  }
}

function printSuccess(framework: Framework, answers: PromptAnswers): void {
  console.log();
  console.log(chalk.green.bold(`✔ ${framework.name} is ready!`));
  if (framework.nextSteps && framework.nextSteps.length > 0) {
    console.log();
    console.log(chalk.bold("Next steps:"));
    for (const step of framework.nextSteps) {
      console.log("  " + chalk.cyan("$ ") + interpolate(step, answers));
    }
  }
  if (framework.docs) {
    console.log();
    console.log(chalk.dim(`Docs: ${framework.docs}`));
  }
  console.log();
}

function printFailure(framework: Framework, err: unknown): void {
  console.log();
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red.bold(`✖ ${framework.name} install failed.`));
  console.error(chalk.red(message));
  if (err instanceof RunError) {
    console.error(chalk.dim(`command: ${err.command}`));
    if (err.exitCode != null) console.error(chalk.dim(`exit code: ${err.exitCode}`));
  }
  console.error();
  console.error(chalk.bold("Suggested fixes:"));
  console.error("  • Check your internet connection.");
  console.error("  • Make sure you have Node.js >= 18 installed.");
  if (framework.docs) {
    console.error(`  • See the official docs: ${chalk.underline(framework.docs)}`);
  }
}
