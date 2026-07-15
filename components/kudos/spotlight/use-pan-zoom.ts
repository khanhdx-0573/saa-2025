"use client";

import { useCallback, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
/** Wheel deltaY -> zoom delta scaling; tuned so a mouse notch feels like ~1 step. */
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

export type UsePanZoomResult = {
  zoom: number;
  handlers: {
    /**
     * A plain native-event callback, NOT a React `onWheel` prop — attach it
     * yourself via `element.addEventListener("wheel", handlers.onWheel, {
     * passive: false })` in a `useEffect` (see `spotlight-board.tsx`).
     * React registers `wheel` as PASSIVE at the root by default (a React
     * 17+ perf convention), so `event.preventDefault()` inside a React
     * synthetic `onWheel` handler is silently a no-op — the zoom state
     * still updated, but the browser's native page-scroll fired right
     * alongside it. Only a real `{ passive: false }` listener actually
     * blocks the scroll.
     */
    onWheel: (event: WheelEvent) => void;
  };
};

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Zoom-only for the Spotlight SVG canvas (no npm dependency, per the locked
 * clarification decision). fix-bug: drag-to-pan was removed per explicit
 * request ("không kéo thả được, zoom được thôi" — dragging shouldn't work,
 * only zoom) — mouse wheel still zooms, clamped to [0.5, 3].
 */
export function usePanZoom(): UsePanZoomResult {
  const [zoom, setZoom] = useState(1);

  const onWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    setZoom((prev) => clampZoom(prev - event.deltaY * WHEEL_ZOOM_SENSITIVITY));
  }, []);

  return { zoom, handlers: { onWheel } };
}
