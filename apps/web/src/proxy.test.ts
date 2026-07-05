import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  middleware: vi.fn(),
}));

vi.mock("@/lib/auth0", () => ({
  auth0: {
    middleware: mocks.middleware,
  },
}));

import { proxy } from "./proxy";

describe("authentication proxy", () => {
  beforeEach(() => {
    mocks.middleware.mockReset();
  });

  it("delegates requests to the Auth0 session boundary", async () => {
    const request = new Request("http://localhost:3000/dashboard");
    const expectedResponse = new Response(null, { status: 200 });
    mocks.middleware.mockResolvedValue(expectedResponse);

    const response = await proxy(request);

    expect(mocks.middleware).toHaveBeenCalledWith(request);
    expect(response).toBe(expectedResponse);
  });
});
