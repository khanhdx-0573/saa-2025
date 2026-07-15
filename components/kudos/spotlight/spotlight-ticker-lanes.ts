/**
 * Geometry for the ticker keep-out zone — the box where `SpotlightActivityTicker`
 * renders plus the thin "flyover lanes" stacked above it. The static layout
 * seeds these into its collision pass (so nothing rests on the ticker and the
 * lanes stay empty); `spotlight-ticker-dodge.ts` targets the lanes per-frame
 * once scrolling.
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, hashSeed, signedUnitFromSeed } from "./spotlight-layout";
import type { Box } from "./spotlight-collision";

// Measured off the live DOM (~492×165) in SVG viewBox units, plus a safety
// margin for names longer than the sample — the ticker is an auto-width text
// row, not a fixed box, so a guessed size ran short.
export const TICKER_RESERVED_WIDTH = 560;
export const TICKER_RESERVED_HEIGHT = 200;
/** Matches `spotlight-activity-ticker.tsx`'s own `left-6`/`bottom-4` insets. */
const TICKER_LEFT_INSET = 24;
const TICKER_BOTTOM_INSET = 16;

/**
 * The ticker keep-out box, anchored to the FIXED viewport's bottom-left corner
 * — the ticker is a screen-pinned overlay, so its box never depends on belt
 * width. Keeps only the STATIC layout off the ticker; while scrolling,
 * `spotlight-ticker-dodge.ts` handles avoidance per-frame instead.
 */
export function getTickerReservedBox(): Box {
  const canvasLeft = -CANVAS_WIDTH / 2;
  const canvasBottom = CANVAS_HEIGHT / 2;
  return {
    x: canvasLeft + TICKER_LEFT_INSET + TICKER_RESERVED_WIDTH / 2,
    y: canvasBottom - TICKER_BOTTOM_INSET - TICKER_RESERVED_HEIGHT / 2,
    width: TICKER_RESERVED_WIDTH,
    height: TICKER_RESERVED_HEIGHT,
  };
}

/** Gap (px) kept clear between stacked lanes (and between the bottom lane and the ticker box) — purely visual breathing room, on top of `spotlight-collision.ts`'s own `GAP`. */
const TICKER_LANE_GAP = 10;
/** Tall enough for one label at any tier plus jitter room — deliberately thin. */
const TICKER_LANE_HEIGHT = 42;
// Several lanes, not one: a dozen-plus senders can transit the ticker's
// x-window at once, and a single lane collapsed them all onto the same y.
// `pickTickerFlyoverLane` spreads them across these rows by hash.
const TICKER_LANE_COUNT = 6;
/** Margin kept clear from a lane's own top/bottom edge — the offset below never pushes a node's target outside its assigned lane's reserved bounds. */
const TICKER_LANE_JITTER_MARGIN = 8;

/**
 * Thin strips stacked above `getTickerReservedBox()`, seeded into the static
 * collision pass so nothing is ever placed there — kept permanently empty so a
 * per-frame dodging node always has a guaranteed-clear spot to land on.
 */
export function getTickerFlyoverLaneBoxes(): Box[] {
  const tickerBox = getTickerReservedBox();
  const boxes: Box[] = [];
  let bottom = tickerBox.y - tickerBox.height / 2 - TICKER_LANE_GAP;
  for (let i = 0; i < TICKER_LANE_COUNT; i += 1) {
    boxes.push({ x: tickerBox.x, y: bottom - TICKER_LANE_HEIGHT / 2, width: tickerBox.width, height: TICKER_LANE_HEIGHT });
    bottom -= TICKER_LANE_HEIGHT + TICKER_LANE_GAP;
  }
  return boxes;
}

/** Deterministic per-node lane assignment, spread across all `TICKER_LANE_COUNT` lanes by hash. */
export function pickTickerFlyoverLane(senderId: string): Box {
  const lanes = getTickerFlyoverLaneBoxes();
  return lanes[hashSeed(senderId) % lanes.length];
}

/**
 * Hash-derived y-offset within a lane's height, so two nodes sharing a lane
 * (inevitable with more transiters than lanes) don't converge on one y and
 * clump. Bounded so it never pushes a node outside the reserved lane.
 */
export function pickTickerFlyoverLaneOffset(senderId: string): number {
  const amplitude = Math.max(0, TICKER_LANE_HEIGHT / 2 - TICKER_LANE_JITTER_MARGIN);
  return signedUnitFromSeed(hashSeed(`${senderId}-lane-offset`)) * amplitude;
}
