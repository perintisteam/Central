<p align="center">
  <img src="https://salmon-wrong-swan-97.mypinata.cloud/ipfs/bafkreigtjsob65jv3ongotzpaimoq34qx4q6siy2cb5jquginpfa773aeq" />
</p>

<h1 align="center">CENTRAL</h1>

<p align="center">One command to install any JS/TS framework.</p>

<p align="center">
  <a href="#installation"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue" alt="license" /></a>
</p>

---

## What is CENTRAL?

**CENTRAL** is a single CLI that replaces a dozen `npx create-*` commands.
Instead of memorising a different scaffold command for every framework, you run:

```bash
central
```

…and pick a framework from an interactive, searchable list. CENTRAL runs the
right `create-*` under the hood and prints next steps for you.

---

## Installation

```bash
npm install -g @axionteams/central
```

The global CLI command is still **`central`** (same as before).

Requires **Node.js >= 18**.

---

## Commands

| Command | Description |
| ------- | ----------- |
| `central` | Interactive mode — pick a framework from a searchable list. |
| `central install <id>` | Install a framework directly by id. |
| `central list` | List all registered frameworks in a table. |
| `central search <query>` | Search frameworks by name, tag, or category. |
| `central add [path]` | Register a new framework — via JSON file, flags, or interactive prompts. |
| `central registry` | Show registry statistics. |
| `central update` | Check for newer versions of CENTRAL itself. |

Every command supports `--help`:

```bash
central install --help
```

---

## Interactive mode

Running `central` with no arguments:

1. Shows the CENTRAL banner and version.
2. Asks what type of project you want (`all` / `fullstack` / `backend` / `frontend` / `meta`).
3. Shows a searchable list of matching frameworks.
4. Displays the picked framework's description and tags.
5. Confirms and runs any extra prompts (e.g. project name).
6. Executes the install command with a spinner.
7. Prints next steps on success, or a suggested fix on failure.

---

## Built-in frameworks

CENTRAL ships with these defaults out of the box:

- **Next.js** — `npx create-next-app@latest`
- **Nest.js** — `npm i -g @nestjs/cli && nest new`
- **Nuxt.js** — `npx nuxi@latest init`
- **SvelteKit** — `npm create svelte@latest`
- **Astro** — `npm create astro@latest`
- **Remix** — `npx create-remix@latest`
- **Express (TS)** — custom scaffold (creates folder, writes `package.json`, installs `express` + types)
- **Hono** — `npm create hono@latest`
- **Vite (React + TS)** — `npm create vite@latest -- --template react-ts`
- **Analog** — `npm create analog@latest`

See them all with:

```bash
central list
```

---

## Adding your own framework

You have three ways to register a framework. All of them persist to
`~/.central/registry.json`, so the framework is available to every future
`central` run.

### Option A — Interactive (no arguments)

```bash
central add
```

CENTRAL walks you through every field (id, name, description, category,
install command, tags, docs URL). If your command contains the
`{{projectName}}` token, CENTRAL offers to auto-add a required text prompt
for it so `central install <id>` asks the user for a project name.

### Option B — One-shot via flags

Useful for scripts, CI, or sharing commands in chat:

```bash
central add \
  --id my-stack \
  --name "My Stack" \
  --description "An opinionated fullstack starter" \
  --category fullstack \
  --tags "react,ssr" \
  --command "npx create-my-stack@latest {{projectName}}"
```

Notes:
- `--id` and `--command` are required in flag mode.
- `--type` is optional; CENTRAL infers `npx`, `npm`, or `custom` from the
  first word of the command.
- If the command references `{{projectName}}` a matching prompt is added
  automatically. Disable with `--no-project-prompt`.

### Option C — Local JSON file

Create a file `my-framework.json`:

```json
{
  "id": "myfw",
  "name": "My Framework",
  "description": "A shiny new meta-framework.",
  "category": "fullstack",
  "tags": ["experimental"],
  "docs": "https://example.com/docs",
  "install": {
    "type": "npx",
    "command": "npx create-myfw@latest {{projectName}}"
  },
  "prompts": [
    {
      "id": "projectName",
      "type": "text",
      "message": "Project name",
      "placeholder": "my-app",
      "required": true
    }
  ],
  "nextSteps": ["cd {{projectName}}", "npm run dev"]
}
```

Register it:

```bash
central add ./my-framework.json
```

### Option D — Programmatic API

```ts
import { registerFramework } from "@axionteams/central";

registerFramework({
  id: "myfw",
  name: "My Framework",
  description: "A shiny new meta-framework.",
  category: "fullstack",
  tags: ["experimental"],
  install: { type: "npx", command: "npx create-myfw@latest {{projectName}}" },
});
```

---

## Security notes

CENTRAL runs scaffold commands on your machine, so custom framework definitions should be treated like executable code.

To reduce command-injection risk, CENTRAL now blocks common shell-control operators inside custom registry commands before execution, including:

- `&&`, `||`, and `;`
- pipes with `|`
- redirects with `<` or `>`
- command substitution using backticks or `$(`
- newline-separated commands
- standalone background execution with `&`

Built-in internal scaffolds such as `central:scaffold-express-ts` are handled by CENTRAL itself. Only install custom framework definitions from sources you trust, and prefer simple single-command scaffolds such as:

```bash
npx create-example@latest {{projectName}}
```

For more details, see `SECURITY.md`.

---

## Framework definition schema

Every framework is validated with [zod](https://zod.dev/) at load time:

```ts
{
  id: string;                       // unique, e.g. "nextjs"
  name: string;                     // display name
  description: string;              // one-line pitch
  category: "fullstack" | "backend" | "frontend" | "meta";
  tags: string[];
  docs?: string;                    // URL
  install: {
    type: "npx" | "npm" | "custom";
    command: string;                // shell command, with {{placeholders}}
    args?: string[];
  };
  prompts?: Array<{
    id: string;                     // answer key
    type: "text" | "confirm" | "select";
    message: string;
    placeholder?: string;
    initial?: string | boolean;
    options?: Array<{ value: string; label: string; hint?: string }>;
    required?: boolean;
  }>;
  nextSteps?: string[];             // shown after a successful install
}
```

Placeholder tokens of the form `{{id}}` inside `install.command` and
`nextSteps` are replaced at runtime by the answer to the prompt with that `id`.

---

## Development

```bash
git clone https://github.com/perintisteam/Central.git
cd Central
npm install
npm run dev       # tsup in watch mode
npm run build     # build to ./dist
npm test          # vitest
```

### Folder layout

```
central/
├── src/
│   ├── cli.ts
│   ├── commands/     # install, list, search, add, registry, update, interactive
│   ├── core/         # registry loader, runner, prompt-engine
│   ├── ui/           # banner, table, spinner
│   ├── registry/     # built-in defaults
│   ├── schemas/      # zod schemas
│   └── utils/        # fs helpers, package-manager detection
├── tests/
└── ...
```

---

## License

MIT
