"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KudosCardData } from "@/components/kudos/feed/kudos-card";
import { toggleKudosLike } from "@/lib/kudos/mutations";
import type { KudosFilters } from "@/lib/kudos/types";

const DEFAULT_PAGE_SIZE = 10;

/** Injected page-fetcher contract. Integration points this at `listAllKudos`
 *  from `lib/kudos/queries.ts`, mapping its `KudosCard` into `KudosCardData`. */
export type FetchKudosPage = (offset: number, limit: number) => Promise<KudosCardData[]>;

function mockProfile(name: string): NonNullable<KudosCardData["sender"]> {
  return { id: `profile-${name}`, fullName: name, avatarUrl: null, department: "CEVC10", starRating: 0 };
}

/** Deterministic build-time mock dataset. */
const MOCK_KUDOS_POOL: KudosCardData[] = Array.from({ length: 24 }, (_, index) => {
  const id = `mock-kudos-${index + 1}`;
  return {
    id,
    sender: mockProfile(`Huỳnh Dương Xuân Nhật ${index + 1}`),
    isAnonymous: false,
    anonymousDisplayName: null,
    recipient: mockProfile(`Huỳnh Dương Xuân ${index + 1}`),
    title: "IDOL GIỚI TRẺ",
    content:
      "Cảm ơn người em bình thường nhưng phi thường :D Cảm ơn sự chăm chỉ, cần mẫn của em đã tạo động lực rất nhiều cho team, để luôn nhắc mình luôn phải nỗ lực hơn nữa trong công việc. <3 và cuộc sống...",
    createdAt: "2025-10-30T10:00:00.000Z",
    hashtags: ["Dedicated", "Inspring"],
    images: [],
    heartCount: 1000,
    likedByMe: false,
  };
});

/** Build-time mock fetcher — slices the deterministic pool above. */
async function mockFetchPage(offset: number, limit: number): Promise<KudosCardData[]> {
  return MOCK_KUDOS_POOL.slice(offset, offset + limit);
}

type UseKudosFeedOptions = {
  filters: KudosFilters;
  /** Defaults to a build-time mock so this hook works standalone. */
  fetchPage?: FetchKudosPage;
  pageSize?: number;
};

type UseKudosFeedResult = {
  cards: KudosCardData[];
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  /** Optimistically flips the like, calls `toggleKudosLike`, reconciles with
   *  the RPC's returned count, and reverts if the mutation fails. */
  toggleLike: (kudosId: string) => void;
  /** Patches one card in place after an edit — no full-feed refetch. */
  updateCard: (kudosId: string, patch: Partial<KudosCardData>) => void;
};

function flipLike(cards: KudosCardData[], kudosId: string): KudosCardData[] {
  return cards.map((card) =>
    card.id === kudosId
      ? { ...card, likedByMe: !card.likedByMe, heartCount: card.heartCount + (card.likedByMe ? -1 : 1) }
      : card
  );
}

function toError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(String(reason));
}

/** Merge `incoming` into `existing`, skipping any card whose `id` is already
 *  present — guards against duplicate cards across page boundaries (FR-012). */
function mergeUniqueById(existing: KudosCardData[], incoming: KudosCardData[]): KudosCardData[] {
  const seen = new Set(existing.map((card) => card.id));
  const merged = [...existing];
  for (const card of incoming) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    merged.push(card);
  }
  return merged;
}

/**
 * Infinite-scroll feed hook (Phase 08 / FR-012): owns `cards`, `offset`,
 * `loading`, `hasMore`, dedups by `id`, exposes `loadMore()`. The
 * page-fetcher is injected (`fetchPage`) with a mock default so this hook is
 * parallel-safe/testable without a real backend — Integration points it at
 * `listAllKudos`. Filter changes reset back to page 1 / empty results.
 */
export function useKudosFeed({
  filters,
  fetchPage = mockFetchPage,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseKudosFeedOptions): UseKudosFeedResult {
  const [cards, setCards] = useState<KudosCardData[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Guards against overlapping in-flight requests (e.g. a stale reset request
  // resolving after a newer one already started) without adding `loading` as
  // a dependency everywhere loadMore/effects are declared.
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    (requestOffset: number, mode: "reset" | "append") => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      fetchPage(requestOffset, pageSize)
        .then((page) => {
          if (requestIdRef.current !== requestId) return; // superseded by a newer request
          setCards((prev) => mergeUniqueById(mode === "reset" ? [] : prev, page));
          setOffset(requestOffset + page.length);
          setHasMore(page.length === pageSize);
        })
        .catch((reason: unknown) => {
          if (requestIdRef.current !== requestId) return;
          setError(toError(reason));
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return;
          setLoading(false);
        });
    },
    [fetchPage, pageSize]
  );

  // Reset to page 1 whenever the filter values or fetcher change (FR-012:
  // "filter change resets to page 1"). Keyed on the primitive filter fields
  // rather than the `filters` object reference so an un-memoized filters
  // object passed by the parent doesn't cause spurious resets. `loadPage`
  // itself sets state (loading/cards/etc.), so it's invoked from a deferred
  // `setTimeout` rather than the effect's synchronous body — calling a
  // state-setting function synchronously inside an effect is flagged by
  // `react-hooks/set-state-in-effect` (matches the fix already applied in
  // `recipient-field.tsx` for the same rule).
  useEffect(() => {
    const timeoutId = setTimeout(() => loadPage(0, "reset"), 0);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on primitive filter fields, not `loadPage`'s identity, to avoid re-fetching on every unrelated re-render
  }, [filters.hashtagId, filters.department, fetchPage]);

  // Refetch from page 1 when a new kudos is created (KudosModal dispatches
  // this event after a successful `createKudos`). Small delay lets the DB
  // commit before we read, avoiding a stale-read race.
  useEffect(() => {
    function handleCreated() {
      setTimeout(() => loadPage(0, "reset"), 100);
    }
    window.addEventListener("kudos:created", handleCreated);
    return () => window.removeEventListener("kudos:created", handleCreated);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    loadPage(offset, "append");
  }, [loading, hasMore, offset, loadPage]);

  const toggleLike = useCallback((kudosId: string) => {
    setCards((prev) => flipLike(prev, kudosId));
    toggleKudosLike(kudosId)
      .then(({ liked, heartCount }) => {
        setCards((prev) =>
          prev.map((card) => (card.id === kudosId ? { ...card, likedByMe: liked, heartCount } : card))
        );
      })
      .catch(() => {
        // Revert the optimistic flip — the mutation didn't apply server-side.
        setCards((prev) => flipLike(prev, kudosId));
      });
  }, []);

  const updateCard = useCallback((kudosId: string, patch: Partial<KudosCardData>) => {
    setCards((prev) => prev.map((card) => (card.id === kudosId ? { ...card, ...patch } : card)));
  }, []);

  return { cards, loading, hasMore, error, loadMore, toggleLike, updateCard };
}
