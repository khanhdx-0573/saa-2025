import { describe, expect, it } from "vitest";
import { computeTickerDodge } from "./spotlight-ticker-dodge";
import type { Box } from "./spotlight-collision";

const tickerBox: Box = { x: -400, y: 200, width: 420, height: 190 };
// Matches `getTickerFlyoverLaneBox()`'s own shape: a thin strip directly above the ticker box.
const laneBox: Box = { x: tickerBox.x, y: tickerBox.y - tickerBox.height / 2 - 12 - 25, width: tickerBox.width, height: 50 };

describe("computeTickerDodge", () => {
  it("returns no dodge when already above the lane (nothing to avoid)", () => {
    expect(computeTickerDodge(-400, -300, tickerBox, laneBox)).toEqual({ dx: 0, dy: 0 });
  });

  it("returns no dodge when within the y-band but far off to the side in x", () => {
    expect(computeTickerDodge(2000, tickerBox.y, tickerBox, laneBox)).toEqual({ dx: 0, dy: 0 });
  });

  it("pulls a node centered directly over the box exactly onto the lane's center", () => {
    const { dx, dy } = computeTickerDodge(tickerBox.x, tickerBox.y, tickerBox, laneBox);
    expect(tickerBox.y + dy).toBeCloseTo(laneBox.y, 5);
    expect(dx).toBeLessThan(0); // drifts in the scroll direction, never toward the ticker
  });

  // fix-bug: an earlier version lifted every node by "just enough to clear
  // the box from its OWN starting depth" — correct against the ticker
  // itself, but that computed landing spot was never checked against
  // whatever else the static layout had placed there, so a dodging node
  // could climb straight into an occupied neighbor. Landing on the SAME
  // guaranteed-empty lane regardless of starting depth is what fixes that.
  it("lands on the same guaranteed-empty lane center from any starting depth in the band", () => {
    const boxBottom = tickerBox.y + tickerBox.height / 2;

    for (const screenY of [laneBox.y + laneBox.height / 2 + 1, tickerBox.y, boxBottom - 1, boxBottom]) {
      const { dy } = computeTickerDodge(tickerBox.x, screenY, tickerBox, laneBox);
      expect(screenY + dy).toBeCloseTo(laneBox.y, 5);
    }
  });

  it("eases smoothly from 0 up to peak as x approaches the ticker center", () => {
    const farEdge = computeTickerDodge(tickerBox.x - (tickerBox.width / 2 + 100), tickerBox.y, tickerBox, laneBox);
    const midway = computeTickerDodge(tickerBox.x - (tickerBox.width / 2 + 50), tickerBox.y, tickerBox, laneBox);
    const center = computeTickerDodge(tickerBox.x, tickerBox.y, tickerBox, laneBox);

    expect(Math.abs(farEdge.dy)).toBeLessThan(Math.abs(midway.dy));
    expect(Math.abs(midway.dy)).toBeLessThan(Math.abs(center.dy));
  });

  it("is symmetric on both sides of the ticker's x-center", () => {
    const left = computeTickerDodge(tickerBox.x - 50, tickerBox.y, tickerBox, laneBox);
    const right = computeTickerDodge(tickerBox.x + 50, tickerBox.y, tickerBox, laneBox);
    expect(left.dy).toBeCloseTo(right.dy, 5);
  });

  it("never dodges a node whose y sits well above the lane, however close in x", () => {
    expect(computeTickerDodge(tickerBox.x, tickerBox.y - 400, tickerBox, laneBox)).toEqual({ dx: 0, dy: 0 });
  });
});
