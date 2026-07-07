import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { detectBodyModelCapability } from "./body-model-capability";
import { BodyModelCard, BodyModelLoading } from "./body-model-card";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("body model capability and states", () => {
  it("uses the static fallback when WebGL is unavailable", () => {
    Object.defineProperty(window, "WebGLRenderingContext", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "WebGL2RenderingContext", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );

    expect(detectBodyModelCapability()).toEqual({
      mode: "static",
      reason: "A static model is shown because WebGL is unavailable.",
    });

    render(<BodyModelCard />);

    expect(
      screen.getByRole("img", {
        name: /static front view of the approximate body model/i,
      }),
    ).toBeVisible();
    expect(screen.getByText(/webgl is unavailable/i)).toBeVisible();
  });

  it("honors reduced motion even when WebGL is available", () => {
    Object.defineProperty(window, "WebGLRenderingContext", {
      configurable: true,
      value: function WebGLRenderingContext() {},
    });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    expect(detectBodyModelCapability()).toEqual({
      mode: "static",
      reason: "A static model is shown because reduced motion is enabled.",
    });
  });

  it("exposes loading progress as a live status", () => {
    render(<BodyModelLoading message="3D model is 40% loaded." />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "3D model is 40% loaded.",
    );
  });
});
