"use client";

import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 250;

/**
 * Delays SHOWING a loading indicator: returns `false` immediately when
 * `loading` is false, and flips to `true` only after `loading` has stayed
 * true for `delayMs`. Fast requests never flash a spinner; only slow ones do.
 * Use this over a raw `loading` flag when entering the loading state would
 * visibly reflow the page.
 */
export function useDebouncedLoading(loading: boolean, delayMs: number = DEFAULT_DELAY_MS): boolean {
  const [debounced, setDebounced] = useState(false);

  // Deferred via `setTimeout` even for the immediate `false` case: setting
  // state synchronously in an effect body trips `react-hooks/set-state-in-effect`.
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(loading), loading ? delayMs : 0);
    return () => clearTimeout(timeoutId);
  }, [loading, delayMs]);

  return debounced;
}
