/**
 * Per-node vertical bob blended into the belt scroll, so each label traces a
 * gentle diagonal instead of a flat horizontal slide. Phase and period both
 * derive from `hashSeed(senderId)` (never `Math.random()`), so nodes bob
 * deterministically and not in lockstep.
 */
import { hashSeed, signedUnitFromSeed } from "./spotlight-layout";

const WAVE_AMPLITUDE = 22;
const WAVE_BASE_PERIOD_SECONDS = 5;
/** +/-15% period variance per node so a whole board of labels doesn't bob in unison. */
const WAVE_PERIOD_VARIANCE = 0.15;

/** `elapsedSeconds` must be monotonic (never wraps) — see `use-belt-scroll.ts` — so the wave has no seam when the belt offset itself wraps at `beltWidth`. */
export function computeWaveDrift(senderId: string, elapsedSeconds: number): number {
  const seed = hashSeed(senderId);
  const phase = ((seed % 1000) / 1000) * 2 * Math.PI;
  const periodFactor = 1 + signedUnitFromSeed(seed >>> 8, 1000) * WAVE_PERIOD_VARIANCE;
  const angularFrequency = (2 * Math.PI) / (WAVE_BASE_PERIOD_SECONDS * periodFactor);
  return Math.sin(elapsedSeconds * angularFrequency + phase) * WAVE_AMPLITUDE;
}
