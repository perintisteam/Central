import Table from "cli-table3";
import chalk from "chalk";
import type { Framework } from "../schemas/framework.schema.js";

const CATEGORY_COLOR: Record<Framework["category"], (s: string) => string> = {
  fullstack: chalk.magenta,
  backend: chalk.yellow,
  frontend: chalk.cyan,
  meta: chalk.gray,
};

export function renderFrameworkTable(frameworks: Framework[]): string {
  const table = new Table({
    head: [
      chalk.bold("ID"),
      chalk.bold("Name"),
      chalk.bold("Category"),
      chalk.bold("Description"),
      chalk.bold("Tags"),
    ],
    style: { head: [], border: ["gray"] },
    colWidths: [18, 22, 12, 50, 30],
    wordWrap: true,
  });

  for (const fw of frameworks) {
    const colour = CATEGORY_COLOR[fw.category];
    table.push([
      chalk.green(fw.id),
      fw.name,
      colour(fw.category),
      fw.description,
      chalk.dim(fw.tags.join(", ")),
    ]);
  }

  return table.toString();
}
