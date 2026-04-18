import { describe, expect, it } from "vitest";
import { interpolate } from "../src/core/runner.js";

describe("interpolate", () => {
  it("replaces {{token}} placeholders with string answers", () => {
    expect(
      interpolate("npx create-next-app {{projectName}}", {
        projectName: "my-app",
      })
    ).toBe("npx create-next-app my-app");
  });

  it("supports whitespace inside the braces", () => {
    expect(interpolate("hello {{  name  }}!", { name: "world" })).toBe(
      "hello world!"
    );
  });

  it("leaves unknown tokens as empty string", () => {
    expect(interpolate("x {{missing}} y", {})).toBe("x  y");
  });

  it("keeps multiple tokens", () => {
    expect(
      interpolate("cmd {{a}} and {{b}}", { a: "1", b: "2" })
    ).toBe("cmd 1 and 2");
  });

  it("coerces booleans: true becomes 'true', false becomes empty", () => {
    expect(interpolate("ts={{typescript}}", { typescript: true })).toBe(
      "ts=true"
    );
    expect(interpolate("ts={{typescript}}", { typescript: false })).toBe(
      "ts="
    );
  });
});
