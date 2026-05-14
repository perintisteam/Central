# Security Policy

CENTRAL executes project scaffold commands on the user's machine. Treat every framework definition from `~/.central/registry.json`, JSON files, flags, or third-party examples as code that can affect your system.

## Command execution hardening

CENTRAL blocks common shell-control operators in custom registry commands before execution. This reduces the risk of command chaining, command substitution, pipes, redirects, and background execution being hidden inside a custom framework definition.

Blocked patterns include:

- `&&`, `||`, `;`
- `|`, `<`, `>`
- backticks
- `$(` command substitution
- newline-separated commands
- standalone `&`

Built-in internal scaffolds such as `central:scaffold-express-ts` are handled by CENTRAL itself and are not treated as arbitrary shell commands.

## Recommended usage

- Only install framework definitions that you trust.
- Review the final command before running a custom framework.
- Prefer simple single-command scaffolds such as `npx create-example@latest {{projectName}}`.
- Do not paste registry definitions from unknown sources without reading them first.

## Reporting security issues

If you find a security issue, please open a private report with the repository maintainer or contact the project owner directly before publishing details publicly.
