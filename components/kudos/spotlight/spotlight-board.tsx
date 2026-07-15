"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SPOTLIGHT_SEARCH_MAX_CHARS } from "@/lib/kudos/validation";
import { usePanZoom } from "./use-pan-zoom";
import { useBeltScroll } from "./use-belt-scroll";
import { computeSpotlightLayout, computeBeltWidth, CANVAS_WIDTH } from "./spotlight-layout";
import type { PositionedSpotlightNode, SpotlightLayoutNode } from "./spotlight-layout";
import type { SpotlightNodeHoverPos } from "./spotlight-node";
import { SearchIcon, SpotlightControls, SpotlightSkeleton, SpotlightTooltip } from "./spotlight-board-controls";
import { SpotlightActivityTicker } from "./spotlight-activity-ticker";
import { SpotlightWordCloud } from "./spotlight-word-cloud";
import type { SpotlightActivityItem } from "./spotlight-activity-ticker";

export type SpotlightData = {
  totalKudos: number;
  nodes: SpotlightLayoutNode[];
  recentActivity: SpotlightActivityItem[];
};

type SpotlightBoardProps = {
  data: SpotlightData;
  loading?: boolean;
  onOpenDetail: (lastKudosId: string) => void;
};

/** Tooltip anchor, already resolved to container-relative coordinates. */
type HoverState = { node: PositionedSpotlightNode; left: number; top: number };

/**
 * SPOTLIGHT BOARD (B.6/B.7): header "{total} KUDOS" + Sunner search + a
 * pan/zoom toggle + a custom SVG/CSS word-cloud of sender names sized by
 * kudos-sent count (product decision: celebrates who GIVES the most kudos,
 * not who receives the most — see `get_spotlight_nodes`). Bespoke,
 * hand-rolled per the locked "no new npm dependency" decision — does not
 * reuse KudosCard, no Track B link. Zoom/pan controls, tooltip, skeleton, and
 * icons live in `spotlight-board-controls.tsx` to keep this file under the
 * ~200-line guidance.
 */
export function SpotlightBoard({ data, loading = false, onOpenDetail }: SpotlightBoardProps) {
  const t = useTranslations("KudosLiveBoard");
  const [search, setSearch] = useState("");
  const [hover, setHover] = useState<HoverState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoom = usePanZoom();

  // Above MAX_STATIC_NODES, `beltWidth` grows past CANVAS_WIDTH and the
  // word-cloud switches to a continuously scrolling belt (see
  // `use-belt-scroll.ts`) instead of cramming every recipient into the same
  // fixed area — density per node stays constant either way.
  const beltWidth = useMemo(() => computeBeltWidth(data.nodes.length), [data.nodes.length]);
  const positioned = useMemo(() => computeSpotlightLayout(data.nodes, beltWidth), [data.nodes, beltWidth]);
  const scrolling = beltWidth > CANVAS_WIDTH;
  // Paused while a tooltip is open — chasing a moving name to click it is bad UX.
  const { offset: beltOffset, elapsedSeconds } = useBeltScroll(beltWidth, hover !== null);

  const query = search.trim().toLowerCase();
  const isMatch = (name: string) => query.length === 0 || name.toLowerCase().includes(query);

  const handleSearchChange = (value: string) => {
    setSearch(value.slice(0, SPOTLIGHT_SEARCH_MAX_CHARS));
  };

  // fix-bug: `onWheel` must be a REAL `{ passive: false }` listener for
  // `preventDefault()` to actually stop page-scroll — see `use-pan-zoom.ts`.
  // Attached to `containerRef` (always mounted, unlike the conditionally
  // rendered `<svg>` below) so wheel events anywhere over the card — which
  // bubble up from the svg — are caught regardless of loading/empty/canvas state.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = panZoom.handlers.onWheel;
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [panZoom.handlers.onWheel]);

  // Expanded is a plain fixed-position overlay (not a native <dialog>) so it
  // can reuse the exact same canvas subtree — including `containerRef`,
  // search/hover/zoom state — with nothing to resync between the embedded
  // and fullscreen shapes. Escape + body-scroll-lock are the two things a
  // native dialog would give for free, so wired up manually here instead.
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const handleHover = (node: PositionedSpotlightNode | null, clientPos: SpotlightNodeHoverPos | null) => {
    if (!node || !clientPos) {
      setHover(null);
      return;
    }
    // Read the container rect here, inside an event handler — never during
    // render — then store plain container-relative coordinates in state.
    const rect = containerRef.current?.getBoundingClientRect();
    const left = rect ? clientPos.x - rect.left + 12 : clientPos.x;
    const top = rect ? clientPos.y - rect.top + 12 : clientPos.y;
    setHover({ node, left, top });
  };

  return (
    <section className="flex flex-col gap-4" aria-label="Spotlight board">
      {/* B.6 section header — same eyebrow/divider/heading shell every other
         board section (Highlight/All Kudos) already renders; this one was
         simply missing. */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="font-montserrat text-2xl font-bold text-details-text-secondary-1">{t("sectionEyebrow")}</h2>
        <div className="h-px w-full bg-details-divider" />
        <h3 className="font-montserrat text-[57px] font-bold leading-[64px] tracking-[-0.25px] text-details-text-primary-1">
          {t("spotlight.heading")}
        </h3>
      </div>

      <div
        ref={containerRef}
        className={
          expanded
            ? "fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-details-background"
            : "relative h-[548px] w-full overflow-hidden rounded-[47px] border border-details-border bg-details-background"
        }
      >
        {/* fix-bug: swapped which layer is the BASE. The network overlay's
           own image is already mostly black (with white lines/dots) — that
           has to be the dominant layer for black to actually dominate, not
           something bolted on after the fact (a scrim, opacity tuning on
           the banner, etc.). Overlay renders FIRST now (no `mix-blend-screen`
           — plain, so it shows as itself, not screened against the banner)
           and the banner renders SECOND, on top, at low opacity, so its
           color only tints through. fix-bug: the overlay's old 1100×618
           offset -35px sizing (from when it was a small decorative layer
           bleeding OVER a full-bleed banner) left a bare ~92px gap on the
           right, uncovered, once it became the full-coverage base — it's a
           plain `fill` now, same as the banner, so both cover the entire
           frame edge-to-edge with no seam. */}
        <Image src="/kudos/spotlight-network-overlay.png" alt="" fill className="object-cover opacity-[0.85]" />
        <Image src="/kudos/spotlight-banner.png" alt="" fill className="object-cover object-left opacity-[0.18]" />

        {/* Search + total-count title live INSIDE the canvas (top-left /
           top-center), not stacked above it — matching B.7.1/B.7.3's actual
           position in the design instead of the earlier above-the-box row.
           fix-bug: `z-20` (was `z-10`, tied with the word-cloud wrapper
           below) — same stacking level + later DOM order let the full-bleed
           SVG canvas win every tie and silently swallow clicks/typing over
           the search input, even though it rendered underneath visually
           (nothing painted over it). Bumping these above the canvas is what
           actually makes the input focusable/clickable again. */}
        <div className="absolute left-6 top-6 z-20 flex h-[39px] items-center gap-2 rounded-full border border-details-border bg-details-textbutton-normal px-4">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            maxLength={SPOTLIGHT_SEARCH_MAX_CHARS}
            placeholder={t("spotlight.searchPlaceholder")}
            aria-label={t("spotlight.searchAriaLabel")}
            className="w-40 bg-transparent font-montserrat text-sm text-details-text-secondary-1 placeholder:text-details-text-secondary-2 focus:outline-none"
          />
        </div>
        <p className="absolute left-1/2 top-6 z-20 -translate-x-1/2 font-montserrat text-[36px] font-bold leading-[44px] text-details-text-secondary-1">
          {t("spotlight.totalLabel", { count: data.totalKudos })}
        </p>

        {/* fix-bug: this wrapper's `relative` is load-bearing. Without it,
           every branch below (skeleton/empty/svg canvas) is a plain
           non-positioned block — CSS always paints `position: absolute`
           siblings (the two background Images above) ON TOP of
           non-positioned content, regardless of DOM order, so the whole
           word-cloud/ticker/controls were rendering hidden underneath them. */}
        <div className="relative z-10 h-full w-full">
          {loading ? (
            <SpotlightSkeleton />
          ) : positioned.length === 0 ? (
            <div className="flex h-full items-center justify-center font-montserrat text-base text-details-text-secondary-2">
              {t("spotlight.empty")}
            </div>
          ) : (
            <>
              <SpotlightWordCloud
                positioned={positioned}
                scrolling={scrolling}
                beltWidth={beltWidth}
                beltOffset={beltOffset}
                elapsedSeconds={elapsedSeconds}
                zoom={panZoom.zoom}
                isMatch={isMatch}
                onHover={handleHover}
                onOpenDetail={onOpenDetail}
              />

              <SpotlightActivityTicker activity={data.recentActivity} />
              <SpotlightControls expanded={expanded} onToggleExpand={() => setExpanded((prev) => !prev)} />

              {hover ? <SpotlightTooltip node={hover.node} left={hover.left} top={hover.top} /> : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
