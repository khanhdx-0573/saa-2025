import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedLoading } from "./use-debounced-loading";

describe("useDebouncedLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays false immediately when loading starts", () => {
    const { result } = renderHook(({ loading }) => useDebouncedLoading(loading), {
      initialProps: { loading: true },
    });
    expect(result.current).toBe(false);
  });

  it("flips to true only after the delay elapses", () => {
    const { result } = renderHook(({ loading }) => useDebouncedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it("resets to false immediately once loading finishes, even mid-delay", () => {
    const { result, rerender } = renderHook(({ loading }) => useDebouncedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(false);
  });

  it("never shows loading at all for a fast request that finishes before the delay", () => {
    const { result, rerender } = renderHook(({ loading }) => useDebouncedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(false);
  });

  it("honors a custom delay", () => {
    const { result } = renderHook(({ loading }) => useDebouncedLoading(loading, 1000), {
      initialProps: { loading: true },
    });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });
});
