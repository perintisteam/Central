#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { createListCommand } from "./commands/list.js";
import { createInstallCommand } from "./commands/install.js";
import { createAddCommand } from "./commands/add.js";
import { createSearchCommand } from "./commands/search.js";
import { createRegistryCommand } from "./commands/registry.js";
import { createUpdateCommand } from "./commands/update.js";
import { runInteractive } from "./commands/interactive.js";
import { CENTRAL_NPM_PACKAGE, CENTRAL_VERSION } from "./version.js";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("central")
    .description("One command to install any JS/TS framework.")
    .version(CENTRAL_VERSION, "-v, --version", "print the CENTRAL version")
    .showHelpAfterError()
    .addHelpText(
      "after",
      `\nExamples:\n  ${chalk.cyan("$ central")}                 run interactive mode\n  ${chalk.cyan("$ central list")}            list all frameworks\n  ${chalk.cyan("$ central install nextjs")} install Next.js directly\n  ${chalk.cyan("$ central search vue")}      search by keyword\n  ${chalk.cyan("$ central add ./my-fw.json")} register a custom framework\n`
    );

  program.addCommand(createListCommand());
  program.addCommand(createInstallCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createAddCommand());
  program.addCommand(createRegistryCommand());
  program.addCommand(
    createUpdateCommand({
      currentVersion: CENTRAL_VERSION,
      packageName: CENTRAL_NPM_PACKAGE,
    })
  );

  program.action(async () => {
    await runInteractive(CENTRAL_VERSION);
  });

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nerror: ${message}`));
    process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`\nfatal: ${message}`));
  process.exit(1);
});
