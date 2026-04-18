import chalk from "chalk";
import { Command } from "commander";
import { loadRegistry } from "../core/registry.js";
import type { Framework } from "../schemas/framework.schema.js";

export function createRegistryCommand(): Command {
  return new Command("registry")
    .description("Show registry statistics")
    .option("--json", "Output as JSON")
    .action(async (opts: { json?: boolean }) => {
      const { frameworks, warnings, userRegistryPath } = await loadRegistry();
      for (const w of warnings) console.error(chalk.yellow(`warn: ${w}`));

      const byCategory = groupByCategory(frameworks);
      const tagCount = new Map<string, number>();
      for (const f of frameworks) {
        for (const t of f.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
      }

      if (opts.json) {
        process.stdout.write(
          JSON.stringify(
            {
              total: frameworks.length,
              categories: Object.fromEntries(
                Object.entries(byCategory).map(([k, v]) => [k, v.length])
              ),
              tags: Object.fromEntries(tagCount),
              userRegistryPath,
            },
            null,
            2
          ) + "\n"
        );
        return;
      }

      console.log();
      console.log(chalk.bold("CENTRAL registry"));
      console.log(chalk.dim(`  stored at ${userRegistryPath}`));
      console.log();
      console.log(`Total frameworks: ${chalk.cyan(frameworks.length)}`);
      console.log();
      console.log(chalk.bold("By category:"));
      for (const [cat, list] of Object.entries(byCategory)) {
        console.log(
          `  ${chalk.magenta(cat.padEnd(10))} ${chalk.cyan(list.length.toString().padStart(2))}  ` +
            chalk.dim(list.map((f) => f.id).join(", "))
        );
      }

      const topTags = [...tagCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      if (topTags.length > 0) {
        console.log();
        console.log(chalk.bold("Top tags:"));
        for (const [tag, count] of topTags) {
          console.log(`  ${chalk.yellow(tag.padEnd(14))} ${chalk.cyan(count)}`);
        }
      }
      console.log();
    });
}

function groupByCategory(
  frameworks: Framework[]
): Record<Framework["category"], Framework[]> {
  const out: Record<Framework["category"], Framework[]> = {
    fullstack: [],
    backend: [],
    frontend: [],
    meta: [],
  };
  for (const f of frameworks) out[f.category].push(f);
  return out;
}
