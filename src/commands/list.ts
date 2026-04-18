import chalk from "chalk";
import { Command } from "commander";
import { loadRegistry } from "../core/registry.js";
import { renderFrameworkTable } from "../ui/table.js";

export function createListCommand(): Command {
  return new Command("list")
    .alias("ls")
    .description("List all registered frameworks")
    .option("-c, --category <category>", "Filter by category (fullstack|backend|frontend|meta)")
    .option("--json", "Output as JSON")
    .action(async (opts: { category?: string; json?: boolean }) => {
      const { frameworks, warnings } = await loadRegistry();
      for (const w of warnings) console.error(chalk.yellow(`warn: ${w}`));

      const filtered = opts.category
        ? frameworks.filter((f) => f.category === opts.category)
        : frameworks;

      if (opts.json) {
        process.stdout.write(JSON.stringify(filtered, null, 2) + "\n");
        return;
      }

      if (filtered.length === 0) {
        console.log(chalk.dim("No frameworks found."));
        return;
      }

      console.log(renderFrameworkTable(filtered));
      console.log(
        chalk.dim(
          `\n${filtered.length} framework${filtered.length === 1 ? "" : "s"}` +
            (opts.category ? ` in category "${opts.category}"` : "") +
            `. Install with: ${chalk.cyan("central install <id>")}`
        )
      );
    });
}
