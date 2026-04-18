import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetInMemoryRegistry,
  loadRegistry,
  registerFramework,
  saveFrameworkToUserRegistry,
} from "../src/core/registry.js";

describe("registry loader", () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "central-test-"));
    process.env.CENTRAL_HOME = tmp;
    __resetInMemoryRegistry();
  });

  afterEach(async () => {
    __resetInMemoryRegistry();
    delete process.env.CENTRAL_HOME;
    await fs.remove(tmp);
  });

  it("loads only built-in defaults when no user registry exists", async () => {
    const { frameworks, warnings } = await loadRegistry();
    expect(warnings).toEqual([]);
    expect(frameworks.length).toBeGreaterThanOrEqual(10);
  });

  it("merges a valid user registry on top of defaults", async () => {
    await fs.writeJson(path.join(tmp, "registry.json"), {
      version: 1,
      frameworks: [
        {
          id: "mycustom",
          name: "My Custom",
          description: "A custom framework from the user registry",
          category: "frontend",
          tags: ["custom"],
          install: { type: "npx", command: "npx create-mycustom {{projectName}}" },
        },
      ],
    });

    const { frameworks, warnings } = await loadRegistry();
    expect(warnings).toEqual([]);

    const custom = frameworks.find((f) => f.id === "mycustom");
    expect(custom).toBeDefined();
    expect(custom?.name).toBe("My Custom");
  });

  it("user registry overrides built-in frameworks with the same id", async () => {
    await fs.writeJson(path.join(tmp, "registry.json"), {
      version: 1,
      frameworks: [
        {
          id: "nextjs",
          name: "Next.js (overridden)",
          description: "custom next",
          category: "fullstack",
          tags: [],
          install: { type: "npx", command: "npx create-next-app@canary" },
        },
      ],
    });

    const { frameworks } = await loadRegistry();
    const next = frameworks.find((f) => f.id === "nextjs");
    expect(next?.name).toBe("Next.js (overridden)");
  });

  it("emits a warning (not a crash) on malformed user registry", async () => {
    await fs.writeJson(path.join(tmp, "registry.json"), {
      version: 1,
      frameworks: "not-an-array",
    });

    const { warnings, frameworks } = await loadRegistry();
    expect(warnings.length).toBeGreaterThan(0);
    expect(frameworks.length).toBeGreaterThanOrEqual(10);
  });

  it("skips individual invalid entries and warns about them", async () => {
    await fs.writeJson(path.join(tmp, "registry.json"), {
      version: 1,
      frameworks: [
        { id: "broken" },
        {
          id: "good",
          name: "Good",
          description: "valid",
          category: "backend",
          tags: [],
          install: { type: "npx", command: "x" },
        },
      ],
    });

    const { warnings, frameworks } = await loadRegistry();
    expect(warnings.some((w) => w.includes("broken"))).toBe(true);
    expect(frameworks.find((f) => f.id === "good")).toBeDefined();
  });

  it("saveFrameworkToUserRegistry persists a valid framework", async () => {
    await saveFrameworkToUserRegistry({
      id: "saved",
      name: "Saved",
      description: "persisted",
      category: "backend",
      tags: ["saved"],
      install: { type: "npx", command: "x" },
    });

    const file = await fs.readJson(path.join(tmp, "registry.json"));
    expect(file.frameworks.some((f: { id: string }) => f.id === "saved")).toBe(
      true
    );
  });

  it("registerFramework makes an entry available in-process", async () => {
    registerFramework({
      id: "inmem",
      name: "In Memory",
      description: "ephemeral",
      category: "meta",
      tags: [],
      install: { type: "npx", command: "noop" },
    });

    const { frameworks } = await loadRegistry();
    expect(frameworks.find((f) => f.id === "inmem")).toBeDefined();
  });
});
