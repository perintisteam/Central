import { z } from "zod";

/**
 * A single dynamic prompt step that can be attached to a framework entry.
 * The answer becomes available to the install command via {{placeholder}} tokens.
 */
export const promptStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "confirm", "select"]),
  message: z.string().min(1),
  placeholder: z.string().optional(),
  initial: z.union([z.string(), z.boolean()]).optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        hint: z.string().optional(),
      })
    )
    .optional(),
  required: z.boolean().optional(),
});

export type PromptStep = z.infer<typeof promptStepSchema>;

export const installSchema = z.object({
  type: z.enum(["npx", "npm", "custom"]),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
});

export type InstallConfig = z.infer<typeof installSchema>;

export const frameworkSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-_]*$/i, "id must be alphanumeric (dashes/underscores allowed)"),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["fullstack", "backend", "frontend", "meta"]),
  tags: z.array(z.string()).default([]),
  docs: z.string().url().optional(),
  install: installSchema,
  prompts: z.array(promptStepSchema).optional(),
  nextSteps: z.array(z.string()).optional(),
});

export type Framework = z.infer<typeof frameworkSchema>;

export const registryFileSchema = z.object({
  version: z.literal(1).default(1),
  frameworks: z.array(frameworkSchema).default([]),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;
