"use client";

import { useEffect, useRef, useState } from "react";

/** Slow, readable drift — fast enough to cycle a big roster through view, slow enough to still read a name in passing. */
const BELT_SCROLL_SPEED_PX_PER_SEC = 24;

export type BeltScrollState = {
  /** In `[0, beltWidth)` — see below for why it wraps. */
  offset: number;
  /** Monotonic, NEVER wraps (unlike `offset`) — `spotlight-wave-drift.ts` needs a seamless time base, and `offset % beltWidth` resetting to 0 would put a visible seam in a sine wave keyed off it. */
  elapsedSeconds: number;
};

/**
 * Drives the Spotlight word-cloud's continuous leftward scroll for rosters
 * over `MAX_STATIC_NODES` (see `spotlight-layout.ts`). Returns an offset in
 * `[0, beltWidth)` that `spotlight-board.tsx` applies as a single SVG
 * `translate(-offset, 0)` around two tiled copies of the same nodes — an
 * offset that wraps at `beltWidth` is exactly what makes the second tile
 * take over seamlessly where the first scrolled off, so the loop never
 * visibly resets.
 *
 * `requestAnimationFrame`-driven rather than a CSS `@keyframes` animation:
 * `beltWidth` is a runtime value (depends on the live node count), and
 * `paused` needs to freeze the scroll instantly while a node's tooltip is
 * open — both are awkward to express as a CSS keyframe's fixed end distance.
 */
export function useBeltScroll(beltWidth: number, paused: boolean): BeltScrollState {
  const [state, setState] = useState<BeltScrollState>({ offset: 0, elapsedSeconds: 0 });
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (beltWidth <= 0) return;

    let frameId: number;
    const tick = (timestamp: number) => {
      const last = lastTimestampRef.current;
      if (last !== null && !paused) {
        const deltaSeconds = (timestamp - last) / 1000;
        setState((prev) => ({
          offset: (prev.offset + BELT_SCROLL_SPEED_PX_PER_SEC * deltaSeconds) % beltWidth,
          elapsedSeconds: prev.elapsedSeconds + deltaSeconds,
        }));
      }
      lastTimestampRef.current = timestamp;
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      lastTimestampRef.current = null;
    };
  }, [beltWidth, paused]);

  return state;
}
