import chalk from "chalk";
import { Command } from "commander";
import { loadRegistry } from "../core/registry.js";
import type { Framework } from "../schemas/framework.schema.js";
import { renderFrameworkTable } from "../ui/table.js";

export function createSearchCommand(): Command {
  return new Command("search")
    .description("Search frameworks by name, tag, or category")
    .argument("<query>", "search term")
    .option("--json", "Output as JSON")
    .action(async (query: string, opts: { json?: boolean }) => {
      const { frameworks, warnings } = await loadRegistry();
      for (const w of warnings) console.error(chalk.yellow(`warn: ${w}`));

      const q = query.trim().toLowerCase();
      const matches = frameworks.filter((f) => matchesFramework(f, q));

      if (opts.json) {
        process.stdout.write(JSON.stringify(matches, null, 2) + "\n");
        return;
      }

      if (matches.length === 0) {
        console.log(chalk.dim(`No frameworks match "${query}".`));
        return;
      }

      console.log(renderFrameworkTable(matches));
      console.log(
        chalk.dim(
          `\n${matches.length} match${matches.length === 1 ? "" : "es"} for "${query}".`
        )
      );
    });
}

function matchesFramework(framework: Framework, q: string): boolean {
  if (q.length === 0) return true;
  const haystack = [
    framework.id,
    framework.name,
    framework.description,
    framework.category,
    ...framework.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
