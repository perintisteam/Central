import chalk from "chalk";

/**
 * Custom ASCII banner requested by the product owner.
 * We render this verbatim instead of calling figlet at runtime, so the
 * welcome screen is deterministic and ships without extra fonts.
 */
const BANNER = String.raw` ██████╗███████╗███╗   ██╗████████╗██████╗  █████╗ ██╗     
██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗██║     
██║     █████╗  ██╔██╗ ██║   ██║   ██████╔╝███████║██║     
██║     ██╔══╝  ██║╚██╗██║   ██║   ██╔══██╗██╔══██║██║     
╚██████╗███████╗██║ ╚████║   ██║   ██║  ██║██║  ██║███████╗
 ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝`;

export interface BannerOptions {
  version?: string;
  tagline?: string;
}

export function renderBanner({
  version,
  tagline = "One command to install any JS/TS framework.",
}: BannerOptions = {}): string {
  const lines = [
    chalk.cyan(BANNER),
    "",
    version ? chalk.dim(`  v${version}  •  ${tagline}`) : chalk.dim(`  ${tagline}`),
    "",
  ];
  return lines.join("\n");
}

export function printBanner(options: BannerOptions = {}): void {
  process.stdout.write(renderBanner(options) + "\n");
}
