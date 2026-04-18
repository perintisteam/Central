import { describe, expect, it } from "vitest";
import { frameworkSchema } from "../src/schemas/framework.schema.js";
import { defaultFrameworks } from "../src/registry/default.js";

describe("frameworkSchema", () => {
  it("accepts a minimal valid framework", () => {
    const result = frameworkSchema.safeParse({
      id: "foo",
      name: "Foo",
      description: "A test framework",
      category: "frontend",
      tags: ["test"],
      install: { type: "npx", command: "npx create-foo" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid category", () => {
    const result = frameworkSchema.safeParse({
      id: "foo",
      name: "Foo",
      description: "Foo",
      category: "nope",
      tags: [],
      install: { type: "npx", command: "x" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects ids with spaces", () => {
    const result = frameworkSchema.safeParse({
      id: "bad id",
      name: "Bad",
      description: "Bad",
      category: "frontend",
      tags: [],
      install: { type: "npx", command: "x" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an install config without a command", () => {
    const result = frameworkSchema.safeParse({
      id: "foo",
      name: "Foo",
      description: "Foo",
      category: "frontend",
      tags: [],
      install: { type: "npx" },
    });
    expect(result.success).toBe(false);
  });
});

describe("default registry", () => {
  it("validates every built-in framework against the schema", () => {
    for (const fw of defaultFrameworks) {
      const result = frameworkSchema.safeParse(fw);
      if (!result.success) {
        throw new Error(
          `Built-in framework "${fw.id}" failed validation: ${result.error.message}`
        );
      }
    }
  });

  it("has unique ids across every built-in framework", () => {
    const ids = defaultFrameworks.map((f) => f.id);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });

  it("includes all 10 frameworks required by the spec", () => {
    const ids = new Set(defaultFrameworks.map((f) => f.id));
    for (const expected of [
      "nextjs",
      "nestjs",
      "nuxt",
      "sveltekit",
      "astro",
      "remix",
      "express-ts",
      "hono",
      "vite-react",
      "analog",
    ]) {
      expect(ids.has(expected)).toBe(true);
    }
  });
});
