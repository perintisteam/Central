import { describe, expect, it } from "vitest";
import {
  buildFramework,
  inferInstallType,
  referencesProjectName,
} from "../src/core/framework-builder.js";

describe("inferInstallType", () => {
  it("detects npx", () => {
    expect(inferInstallType("npx create-next-app@latest")).toBe("npx");
  });
  it("detects npm", () => {
    expect(inferInstallType("npm create vite@latest")).toBe("npm");
  });
  it("falls back to custom for anything else", () => {
    expect(inferInstallType("bun create hono")).toBe("custom");
    expect(inferInstallType("pnpm dlx create-astro")).toBe("custom");
    expect(inferInstallType("git clone ...")).toBe("custom");
  });
});

describe("referencesProjectName", () => {
  it("detects {{projectName}} tokens", () => {
    expect(referencesProjectName("npx create-x {{projectName}}")).toBe(true);
    expect(referencesProjectName("npx create-x {{ projectName }}")).toBe(true);
    expect(referencesProjectName("npx create-x my-app")).toBe(false);
  });
});

describe("buildFramework", () => {
  it("builds a minimal framework from flags", () => {
    const r = buildFramework({
      id: "myfw",
      command: "npx create-myfw@latest {{projectName}}",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.id).toBe("myfw");
    expect(r.framework.name).toBe("myfw");
    expect(r.framework.category).toBe("frontend");
    expect(r.framework.install.type).toBe("npx");
  });

  it("auto-adds a projectName prompt when the command references it", () => {
    const r = buildFramework({
      id: "myfw",
      command: "npx create-myfw {{projectName}}",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.prompts).toHaveLength(1);
    expect(r.framework.prompts?.[0]?.id).toBe("projectName");
    expect(r.framework.prompts?.[0]?.required).toBe(true);
  });

  it("does not auto-add a prompt when the command has no token", () => {
    const r = buildFramework({
      id: "myfw",
      command: "npx some-thing --no-interactive",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.prompts).toBeUndefined();
  });

  it("respects autoProjectNamePrompt: false", () => {
    const r = buildFramework({
      id: "myfw",
      command: "npx create-myfw {{projectName}}",
      autoProjectNamePrompt: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.prompts).toBeUndefined();
  });

  it("normalises a comma-separated tags string", () => {
    const r = buildFramework({
      id: "myfw",
      command: "npx create-myfw",
      tags: "react,  ssr ,edge",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.tags).toEqual(["react", "ssr", "edge"]);
  });

  it("accepts an array of tags", () => {
    const r = buildFramework({
      id: "myfw",
      command: "npx create-myfw",
      tags: ["a", "b"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.tags).toEqual(["a", "b"]);
  });

  it("infers install type from the command when --type is omitted", () => {
    const a = buildFramework({ id: "a", command: "npm create hono@latest" });
    const b = buildFramework({ id: "b", command: "bun create something" });
    expect(a.ok && a.framework.install.type).toBe("npm");
    expect(b.ok && b.framework.install.type).toBe("custom");
  });

  it("honours an explicit install type", () => {
    const r = buildFramework({
      id: "myfw",
      command: "bun create my-thing",
      type: "custom",
    });
    expect(r.ok && r.framework.install.type).toBe("custom");
  });

  it("errors when id is missing", () => {
    const r = buildFramework({ id: "", command: "npx foo" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.issues.some((i) => i.toLowerCase().includes("id"))).toBe(true);
  });

  it("errors when command is missing", () => {
    const r = buildFramework({ id: "ok", command: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.issues.some((i) => i.toLowerCase().includes("command"))).toBe(true);
  });

  it("errors on an invalid id slug", () => {
    const r = buildFramework({ id: "bad id!", command: "npx foo" });
    expect(r.ok).toBe(false);
  });

  it("defaults description when none is provided", () => {
    const r = buildFramework({ id: "myfw", command: "npx foo" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.description.length).toBeGreaterThan(0);
  });

  it("trims whitespace on inputs", () => {
    const r = buildFramework({
      id: "  myfw  ",
      name: "  My Framework  ",
      command: "  npx create-myfw  ",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.framework.id).toBe("myfw");
    expect(r.framework.name).toBe("My Framework");
    expect(r.framework.install.command).toBe("npx create-myfw");
  });
});
