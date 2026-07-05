import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./redirects";

describe("safeReturnTo", () => {
  it("accepts an application-relative path", () => {
    expect(safeReturnTo("/dashboard")).toBe("/dashboard");
  });

  it.each([
    undefined,
    "",
    "https://malicious.example",
    "//malicious.example",
    "/\\malicious.example",
  ])("rejects unsafe return destinations", (destination) => {
    expect(safeReturnTo(destination)).toBe("/dashboard");
  });
});
