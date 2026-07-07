import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("web health route", () => {
  it("returns an uncached ok response", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      service: "project-mt-web",
      status: "ok",
    });
  });
});
