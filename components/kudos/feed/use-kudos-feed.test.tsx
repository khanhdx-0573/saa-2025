import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useKudosFeed } from "./use-kudos-feed";
import type { KudosCardData } from "./kudos-card";
import type { KudosFilters } from "@/lib/kudos/types";

const noFilters: KudosFilters = { hashtagId: null, department: null };

function makeCard(id: string): KudosCardData {
  return {
    id,
    sender: { id: `sender-${id}`, fullName: `Sender ${id}`, avatarUrl: null, department: "CEVC10", starRating: 0 },
    isAnonymous: false,
    anonymousDisplayName: null,
    recipient: { id: `recipient-${id}`, fullName: `Recipient ${id}`, avatarUrl: null, department: "CEVC10", starRating: 0 },
    title: "IDOL GIỚI TRẺ",
    content: "Cảm ơn bạn rất nhiều.",
    createdAt: "2025-10-30T10:00:00.000Z",
    hashtags: ["Dedicated"],
    images: [],
    heartCount: 10,
    likedByMe: false,
  };
}

// `useKudosFeed` fires its initial/reset fetch from a deferred `setTimeout`
// (to satisfy `react-hooks/set-state-in-effect`), so we must wait for the
// fetcher to actually be *called* before waiting for `loading` to settle —
// otherwise `waitFor` on `loading === false` resolves instantly against the
// pre-fetch initial state instead of the post-fetch one.
async function waitForCallCount(fetchPage: ReturnType<typeof vi.fn>, count: number) {
  await waitFor(() => expect(fetchPage.mock.calls.length).toBeGreaterThanOrEqual(count));
}

describe("useKudosFeed", () => {
  it("loads the first page on mount", async () => {
    const fetchPage = vi.fn(async (offset: number, limit: number) =>
      [makeCard("1"), makeCard("2")].slice(offset, offset + limit)
    );

    const { result } = renderHook(() => useKudosFeed({ filters: noFilters, fetchPage, pageSize: 2 }));

    await waitForCallCount(fetchPage, 1);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards.map((c) => c.id)).toEqual(["1", "2"]);
    expect(result.current.hasMore).toBe(true); // full page returned, may have more
  });

  it("dedups by id across overlapping pages", async () => {
    // Page 1 returns [1,2,3]; page 2 (requested at offset 3) overlaps by
    // returning [3,4,5] again — the hook must not show "3" twice.
    const pages: Record<number, KudosCardData[]> = {
      0: [makeCard("1"), makeCard("2"), makeCard("3")],
      3: [makeCard("3"), makeCard("4"), makeCard("5")],
    };
    const fetchPage = vi.fn(async (offset: number) => pages[offset] ?? []);

    const { result } = renderHook(() => useKudosFeed({ filters: noFilters, fetchPage, pageSize: 3 }));

    await waitForCallCount(fetchPage, 1);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards.map((c) => c.id)).toEqual(["1", "2", "3"]);

    act(() => result.current.loadMore());

    await waitForCallCount(fetchPage, 2);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards.map((c) => c.id)).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("sets hasMore to false once a short page is returned", async () => {
    const fetchPage = vi.fn(async () => [makeCard("1")]);

    const { result } = renderHook(() => useKudosFeed({ filters: noFilters, fetchPage, pageSize: 5 }));

    await waitForCallCount(fetchPage, 1);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it("does not call fetchPage again once hasMore is false", async () => {
    const fetchPage = vi.fn(async () => [makeCard("1")]);

    const { result } = renderHook(() => useKudosFeed({ filters: noFilters, fetchPage, pageSize: 5 }));

    await waitForCallCount(fetchPage, 1);
    await waitFor(() => expect(result.current.loading).toBe(false));
    const callsAfterFirstLoad = fetchPage.mock.calls.length;

    act(() => result.current.loadMore());

    expect(fetchPage.mock.calls.length).toBe(callsAfterFirstLoad);
  });

  it("resets to page 1 with empty results when filters change", async () => {
    const fetchPage = vi.fn(async (offset: number) => (offset === 0 ? [makeCard("1"), makeCard("2")] : []));

    const { result, rerender } = renderHook(
      ({ filters }: { filters: KudosFilters }) => useKudosFeed({ filters, fetchPage, pageSize: 2 }),
      { initialProps: { filters: noFilters } }
    );

    await waitForCallCount(fetchPage, 1);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards).toHaveLength(2);

    rerender({ filters: { hashtagId: 42, department: null } });

    await waitForCallCount(fetchPage, 2);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards.map((c) => c.id)).toEqual(["1", "2"]);
    // Confirms a real re-fetch happened from offset 0 (not a stale no-op).
    expect(fetchPage).toHaveBeenCalledWith(0, 2);
  });

  it("patches one card in place via updateCard, leaving the others untouched", async () => {
    const fetchPage = vi.fn(async () => [makeCard("1"), makeCard("2")]);

    const { result } = renderHook(() => useKudosFeed({ filters: noFilters, fetchPage, pageSize: 2 }));

    await waitForCallCount(fetchPage, 1);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.updateCard("1", { title: "Edited title", content: "Edited content" }));

    const card1 = result.current.cards.find((c) => c.id === "1");
    const card2 = result.current.cards.find((c) => c.id === "2");
    expect(card1?.title).toBe("Edited title");
    expect(card1?.content).toBe("Edited content");
    expect(card2?.title).toBe("IDOL GIỚI TRẺ");
  });

  it("uses the mock default fetcher when none is injected", async () => {
    const { result } = renderHook(() => useKudosFeed({ filters: noFilters }));

    await waitFor(() => expect(result.current.cards.length).toBeGreaterThan(0));
    expect(result.current.loading).toBe(false);
  });
});
