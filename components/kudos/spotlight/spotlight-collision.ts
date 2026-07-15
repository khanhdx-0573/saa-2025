/**
 * Pure, deterministic local-search collision resolver for the Spotlight
 * word-cloud. A label's nudge derives only from its `senderId` hash (never
 * `Math.random()`), so it's stable across re-renders.
 */

export type Box = { x: number; y: number; width: number; height: number };
export type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number };

/** Minimum clear space kept between two labels' boxes, on top of their own half-widths/heights. */
const GAP = 4;
// Empirically tuned against real dataset density — larger radii/attempt counts
// measured WORSE (wandering searches clamp back into edge labels). A bounded
// local search can't guarantee zero overlap at this density; a rare residual
// overlap beats an unbounded search or a visible "shove everything one way" bias.
const MAX_ATTEMPTS = 150;
const RING_STEP = 24;
const ATTEMPTS_PER_RING = 12;
const GOLDEN_ANGLE_RAD = (137.50776405003785 * Math.PI) / 180;

export function boxesOverlap(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + GAP && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + GAP;
}

function clampToBounds(x: number, y: number, bounds?: Bounds): { x: number; y: number } {
  if (!bounds) return { x, y };
  return {
    x: Math.min(bounds.xMax, Math.max(bounds.xMin, x)),
    y: Math.min(bounds.yMax, Math.max(bounds.yMin, y)),
  };
}

/**
 * Walks a deterministic golden-angle spiral of offsets around the ORIGINAL
 * candidate point (never a shared center) until a clear spot is found, or
 * returns the candidate as-is after `MAX_ATTEMPTS`.
 *
 * `bounds`, when given, is clamped on EVERY attempt BEFORE its collision check,
 * never after: clamping a resolved position afterwards could walk it straight
 * back into an obstacle it had just escaped, since that point was never checked.
 */
export function findFreePosition(
  candidate: Box,
  placed: readonly Box[],
  angleSeed: number,
  bounds?: Bounds,
): { x: number; y: number } {
  const isClear = (box: Box) => !placed.some((other) => boxesOverlap(box, other));

  const initial = clampToBounds(candidate.x, candidate.y, bounds);
  if (isClear({ ...candidate, ...initial })) {
    return initial;
  }

  const startAngle = ((angleSeed % 360) * Math.PI) / 180;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const ring = Math.ceil(attempt / ATTEMPTS_PER_RING);
    const angle = startAngle + attempt * GOLDEN_ANGLE_RAD;
    const radius = ring * RING_STEP;
    const clamped = clampToBounds(candidate.x + Math.cos(angle) * radius, candidate.y + Math.sin(angle) * radius, bounds);
    if (isClear({ ...candidate, ...clamped })) {
      return clamped;
    }
  }
  return initial;
}
