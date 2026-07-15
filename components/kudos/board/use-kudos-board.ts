"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { KudosCardData } from "@/components/kudos/feed/kudos-card";
import type { SpotlightData as SpotlightBoardData } from "@/components/kudos/spotlight/spotlight-board";
import { mapKudosCardToCardData } from "@/lib/kudos/queries-mappers";
import { createClient } from "@/lib/supabase/client";
import {
  listHighlightKudos,
  listAllKudos,
  getSpotlightData,
  getKudosStats,
  listHashtags,
  listDepartments,
} from "@/lib/kudos/queries";
import { toggleKudosLike } from "@/lib/kudos/mutations";
import type { Hashtag, KudosCard, KudosFilters, KudosStats } from "@/lib/kudos/types";

const EMPTY_FILTERS: KudosFilters = { hashtagId: null, department: null };
const EMPTY_STATS: KudosStats = { received: 0, sent: 0, hearts: 0 };
const EMPTY_SPOTLIGHT: SpotlightBoardData = { totalKudos: 0, nodes: [], recentActivity: [] };

function flipLike(cards: KudosCard[], kudosId: string): KudosCard[] {
  return cards.map((card) =>
    card.id === kudosId
      ? { ...card, likedByMe: !card.likedByMe, heartCount: card.heartCount + (card.likedByMe ? -1 : 1) }
      : card
  );
}

// Optimistic like flip, reconciled with the RPC and reverted on failure. Kept
// module-level (not inlined in a useCallback) so the React Compiler's dependency
// inference isn't confused by the nested .then()/.catch() bodies.
function toggleHighlightCardLike(kudosId: string, setCards: Dispatch<SetStateAction<KudosCard[]>>): void {
  setCards((prev) => flipLike(prev, kudosId));
  toggleKudosLike(kudosId)
    .then(({ liked, heartCount }) => {
      setCards((prev) => prev.map((card) => (card.id === kudosId ? { ...card, likedByMe: liked, heartCount } : card)));
    })
    .catch(() => {
      setCards((prev) => flipLike(prev, kudosId));
    });
}

// Owns all board-level data: the shared Hashtag/Department filter, the
// Highlight/Spotlight/Sidebar fetches (re-run when `filters` changes), and the
// Highlight like handler. Split out to keep kudos-page-client.tsx layout-only.
export function useKudosBoard(currentUserId: string | null, unknownUserLabel: string) {
  const [filters, setFilters] = useState<KudosFilters>(EMPTY_FILTERS);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [highlightRaw, setHighlightRaw] = useState<KudosCard[]>([]);
  const [highlightLoading, setHighlightLoading] = useState(true);

  const [spotlightData, setSpotlightData] = useState<SpotlightBoardData>(EMPTY_SPOTLIGHT);
  const [spotlightLoading, setSpotlightLoading] = useState(true);

  const [stats, setStats] = useState<KudosStats>(EMPTY_STATS);

  // Filter option lists (Hashtag/Department dropdowns) — fetched once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([listHashtags(), listDepartments()])
      .then(([hashtagList, departmentList]) => {
        if (cancelled) return;
        setHashtags(hashtagList);
        setDepartments(departmentList);
      })
      .catch(() => {
        // Non-critical: dropdowns fall back to "All" only rather than blocking the board.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Highlight — depends on `filters`. Deferred via setTimeout(0) so the
  // state-set isn't synchronous in the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setHighlightLoading(true);
      listHighlightKudos(filters)
        .then((cards) => {
          if (!cancelled) setHighlightRaw(cards);
        })
        .catch(() => {
          if (!cancelled) setHighlightRaw([]);
        })
        .finally(() => {
          if (!cancelled) setHighlightLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [filters]);

  // Spotlight — depends on `filters` (same deferred-set convention as above).
  // Also subscribes to realtime `kudos` INSERTs so the word-cloud/ticker update
  // live; the subscription shares this effect to match the fetch's lifecycle.
  useEffect(() => {
    let cancelled = false;

    function applyResult(result: Awaited<ReturnType<typeof getSpotlightData>>) {
      if (cancelled) return;
      // `full_name` is nullable in the DB — fall back to unknownUserLabel, as
      // mapKudosCardToCardData already does for card names.
      setSpotlightData({
        totalKudos: result.totalKudos,
        nodes: result.nodes.map((node) => ({ ...node, fullName: node.fullName ?? unknownUserLabel })),
        recentActivity: result.recentActivity.map((item) => ({
          ...item,
          fullName: item.fullName ?? unknownUserLabel,
        })),
      });
    }

    const timeoutId = setTimeout(() => {
      setSpotlightLoading(true);
      getSpotlightData(filters)
        .then(applyResult)
        .catch(() => {
          if (!cancelled) setSpotlightData(EMPTY_SPOTLIGHT);
        })
        .finally(() => {
          if (!cancelled) setSpotlightLoading(false);
        });
    }, 0);

    // Realtime refetch is deliberately silent (no loading toggle) — flashing
    // the skeleton on every incoming kudos would be jarring.
    const supabase = createClient();
    const channel = supabase
      .channel("spotlight-kudos-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "kudos" }, () => {
        getSpotlightData(filters).then(applyResult).catch(() => {});
      })
      .subscribe();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [filters, unknownUserLabel]);

  // Sidebar stats — depend on the signed-in user, not the board filters.
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    getKudosStats(currentUserId)
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch(() => {
        if (!cancelled) setStats(EMPTY_STATS);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const highlightCards: KudosCardData[] = highlightRaw.map((card) =>
    mapKudosCardToCardData(card, { unknownUserLabel })
  );

  const handleHighlightLike = useCallback(
    (kudosId: string) => toggleHighlightCardLike(kudosId, setHighlightRaw),
    [setHighlightRaw]
  );

  const fetchAllKudosPage = useCallback(
    async (offset: number, limit: number): Promise<KudosCardData[]> => {
      // Product decision: All Kudos only ever shows the viewer's own sent kudos
      // (every card there must be editable — see the edit pencil's `canEdit` check).
      const page = await listAllKudos(filters, limit, offset, currentUserId);
      return page.map((card) => mapKudosCardToCardData(card, { unknownUserLabel }));
    },
    [filters, currentUserId, unknownUserLabel]
  );

  return {
    filters,
    setFilters,
    hashtags,
    departments,
    highlightCards,
    highlightLoading,
    spotlightData,
    spotlightLoading,
    stats,
    handleHighlightLike,
    fetchAllKudosPage,
  };
}
