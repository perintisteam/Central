import {
  frameworkSchema,
  type Framework,
  type InstallConfig,
  type PromptStep,
} from "../schemas/framework.schema.js";

export interface FrameworkDraft {
  id: string;
  name?: string;
  description?: string;
  category?: Framework["category"];
  tags?: string[] | string;
  docs?: string;
  command: string;
  type?: InstallConfig["type"];
  prompts?: PromptStep[];
  nextSteps?: string[];
  /**
   * If true (default) and the command references {{projectName}} but no
   * prompts were provided, a required text prompt for projectName is added
   * automatically so the token resolves at install time.
   */
  autoProjectNamePrompt?: boolean;
}

export interface BuildResult {
  ok: true;
  framework: Framework;
}

export interface BuildError {
  ok: false;
  issues: string[];
}

/**
 * Build and validate a Framework from loosely-typed inputs (CLI flags,
 * interactive prompt answers, etc.). This is the single source of truth
 * for "turn user input into a registry entry".
 */
export function buildFramework(draft: FrameworkDraft): BuildResult | BuildError {
  const issues: string[] = [];

  const id = draft.id?.trim() ?? "";
  if (!id) issues.push("id is required");

  const command = draft.command?.trim() ?? "";
  if (!command) issues.push("install command is required");

  if (issues.length > 0) return { ok: false, issues };

  const tags = normaliseTags(draft.tags);
  const type: InstallConfig["type"] = draft.type ?? inferInstallType(command);
  const shouldAutoPrompt = draft.autoProjectNamePrompt ?? true;

  const prompts =
    draft.prompts && draft.prompts.length > 0
      ? draft.prompts
      : shouldAutoPrompt && referencesProjectName(command)
        ? [defaultProjectNamePrompt()]
        : undefined;

  const candidate = {
    id,
    name: draft.name?.trim() || id,
    description:
      draft.description?.trim() || `User-registered framework "${id}".`,
    category: draft.category ?? "frontend",
    tags,
    docs: draft.docs?.trim() || undefined,
    install: { type, command },
    prompts,
    nextSteps: draft.nextSteps,
  };

  const parsed = frameworkSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`
      ),
    };
  }
  return { ok: true, framework: parsed.data };
}

export function inferInstallType(command: string): InstallConfig["type"] {
  const head = command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (head === "npx") return "npx";
  if (head === "npm") return "npm";
  return "custom";
}

export function referencesProjectName(command: string): boolean {
  return /\{\{\s*projectName\s*\}\}/.test(command);
}

function defaultProjectNamePrompt(): PromptStep {
  return {
    id: "projectName",
    type: "text",
    message: "Project name",
    placeholder: "my-app",
    required: true,
  };
}

function normaliseTags(input: string[] | string | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((t) => t.trim()).filter((t) => t.length > 0);
  }
  return input
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
