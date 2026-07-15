/**
 * Per-frame ticker avoidance for the scrolling belt. The static layout only
 * keeps a node off the ticker AT LAYOUT TIME; once scrolling, its on-screen x
 * keeps changing, so it can slide back under the screen-fixed ticker later.
 *
 * A dodging node is pulled onto one of `getTickerFlyoverLaneBoxes()` — thin
 * strips the static layout keeps permanently empty — so it always has a
 * guaranteed-clear spot to land, rather than climbing into an occupied
 * neighbor or emptying the ticker's whole row (which read as dead space).
 */
import type { Box } from "./spotlight-collision";

/** Extra runway (px) on each side of the ticker box where the pull eases in/out, instead of snapping on/off. */
const INFLUENCE_MARGIN = 100;
// Gate covers the ticker's OWN band plus a small margin only — not up through
// the lanes. A wider gate swept in far more nodes than could ever touch the
// ticker at once and pulled them all toward the lanes, clumping them together.
const GATE_MARGIN = 30;
/** Sideways kick (px) at peak pull, in the scroll direction — reads as a diagonal swoop rather than a pure vertical pop. */
const MAX_DRIFT = 16;

export type TickerDodge = { dx: number; dy: number };

/**
 * `screenX`/`screenY` must be the node's CURRENT on-screen position (resting
 * layout + wave drift − live belt offset), NOT its static `x`/`y`. Returns
 * `{ dx: 0, dy: 0 }` outside the influence zone, so callers can add the result
 * straight onto a node's position with no branching.
 *
 * `laneBox`/`laneOffsetY` come from `pickTickerFlyoverLane`/`...Offset`. A node
 * fully inside the influence zone is pulled exactly onto `laneBox.y + laneOffsetY`,
 * regardless of where within the zone it started.
 */
export function computeTickerDodge(
  screenX: number,
  screenY: number,
  tickerBox: Box,
  laneBox: Box,
  laneOffsetY: number = 0
): TickerDodge {
  const gateTop = tickerBox.y - tickerBox.height / 2 - GATE_MARGIN;
  const gateBottom = tickerBox.y + tickerBox.height / 2 + GATE_MARGIN;
  if (screenY < gateTop || screenY > gateBottom) return { dx: 0, dy: 0 };

  const boxHalfWidth = tickerBox.width / 2;
  const offsetX = screenX - tickerBox.x;
  const absOffsetX = Math.abs(offsetX);
  if (absOffsetX > boxHalfWidth + INFLUENCE_MARGIN) return { dx: 0, dy: 0 };

  // 1 directly over the box, easing to 0 across the margin — full pull is only
  // guaranteed over the box, the margin is purely a smooth ramp.
  const horizontalFactor = absOffsetX <= boxHalfWidth ? 1 : 1 - (absOffsetX - boxHalfWidth) / INFLUENCE_MARGIN;
  const eased = (1 - Math.cos(Math.max(0, horizontalFactor) * Math.PI)) / 2;

  const requiredDy = laneBox.y + laneOffsetY - screenY;

  return { dx: -eased * MAX_DRIFT, dy: requiredDy * eased };
}
