import { describe, expect, it } from "vitest";
import { computeWaveDrift } from "./spotlight-wave-drift";

describe("computeWaveDrift", () => {
  it("is deterministic for the same senderId and elapsedSeconds", () => {
    expect(computeWaveDrift("sender-1", 12.5)).toBe(computeWaveDrift("sender-1", 12.5));
  });

  it("stays within a bounded amplitude", () => {
    for (let t = 0; t < 30; t += 0.37) {
      expect(Math.abs(computeWaveDrift("sender-1", t))).toBeLessThanOrEqual(22.0001);
    }
  });

  it("varies over time for a fixed node (it's a wave, not a constant offset)", () => {
    const values = new Set(
      Array.from({ length: 10 }, (_, i) => Math.round(computeWaveDrift("sender-1", i * 0.5) * 100))
    );
    expect(values.size).toBeGreaterThan(1);
  });

  it("gives different nodes different phases (not all bobbing in lockstep)", () => {
    const a = computeWaveDrift("sender-a", 3);
    const b = computeWaveDrift("sender-b", 3);
    expect(a).not.toBeCloseTo(b, 5);
  });
});
