import { z } from "zod";
import {
  frameworkSchema,
  registryFileSchema,
  type Framework,
  type RegistryFile,
} from "../schemas/framework.schema.js";

/**
 * Permissive wrapper used when loading the user registry file.
 * We accept any shape for individual entries here so that per-entry
 * validation errors become actionable warnings (instead of failing
 * the entire file).
 */
const permissiveRegistryFile = z.object({
  version: z.literal(1).default(1),
  frameworks: z.array(z.unknown()).default([]),
});
import { defaultFrameworks } from "../registry/default.js";
import {
  getUserRegistryPath,
  ensureCentralHome,
  readJsonSafe,
  writeJson,
} from "../utils/fs.js";

/**
 * In-memory overrides registered via the programmatic API.
 * These take precedence over the user-registry file (which itself
 * takes precedence over the built-in defaults).
 */
const inMemoryFrameworks = new Map<string, Framework>();

export interface LoadedRegistry {
  /** Merged + validated list of frameworks (defaults, user file, in-memory). */
  frameworks: Framework[];
  /** Where the user registry lives on disk. */
  userRegistryPath: string;
  /** Validation warnings for individual invalid user entries (we still load the rest). */
  warnings: string[];
}

/**
 * Load and merge the full registry.
 * Precedence (last writer wins for a given id):
 *   built-in defaults  <  user registry file  <  in-memory overrides
 */
export async function loadRegistry(): Promise<LoadedRegistry> {
  const warnings: string[] = [];
  const userRegistryPath = getUserRegistryPath();

  const validatedDefaults = validateFrameworks(
    defaultFrameworks,
    "built-in default",
    warnings
  );

  const userFile = await readJsonSafe<unknown>(userRegistryPath);
  let userFrameworks: Framework[] = [];
  if (userFile !== undefined) {
    const parsed = permissiveRegistryFile.safeParse(userFile);
    if (parsed.success) {
      userFrameworks = validateFrameworks(
        parsed.data.frameworks,
        "user registry",
        warnings
      );
    } else {
      warnings.push(
        `User registry at ${userRegistryPath} is malformed: ${formatZodError(parsed.error)}`
      );
    }
  }

  const merged = new Map<string, Framework>();
  for (const fw of validatedDefaults) merged.set(fw.id, fw);
  for (const fw of userFrameworks) merged.set(fw.id, fw);
  for (const fw of inMemoryFrameworks.values()) merged.set(fw.id, fw);

  return {
    frameworks: [...merged.values()].sort((a, b) => a.name.localeCompare(b.name)),
    userRegistryPath,
    warnings,
  };
}

/** Persist a new framework into the user registry file at ~/.central/registry.json. */
export async function saveFrameworkToUserRegistry(framework: Framework): Promise<void> {
  const parsed = frameworkSchema.parse(framework);
  await ensureCentralHome();
  const userRegistryPath = getUserRegistryPath();

  const existing = await readJsonSafe<unknown>(userRegistryPath);
  const current: RegistryFile = existing
    ? registryFileSchema.parse(existing)
    : { version: 1, frameworks: [] };

  const without = current.frameworks.filter((f) => f.id !== parsed.id);
  const next: RegistryFile = {
    version: 1,
    frameworks: [...without, parsed],
  };

  await writeJson(userRegistryPath, next);
}

/**
 * Programmatic registration (Option C from the spec).
 * Takes effect for the current process only.
 */
export function registerFramework(framework: Framework): Framework {
  const parsed = frameworkSchema.parse(framework);
  inMemoryFrameworks.set(parsed.id, parsed);
  return parsed;
}

/** Only intended for tests — wipe in-memory overrides. */
export function __resetInMemoryRegistry(): void {
  inMemoryFrameworks.clear();
}

function validateFrameworks(
  raw: unknown[],
  source: string,
  warnings: string[]
): Framework[] {
  const out: Framework[] = [];
  for (const entry of raw) {
    const parsed = frameworkSchema.safeParse(entry);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      const id =
        entry && typeof entry === "object" && "id" in entry
          ? String((entry as { id: unknown }).id)
          : "<unknown>";
      warnings.push(
        `Skipping invalid ${source} entry "${id}": ${formatZodError(parsed.error)}`
      );
    }
  }
  return out;
}

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}
