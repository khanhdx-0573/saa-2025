"use client";

import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./spotlight-layout";
import type { PositionedSpotlightNode } from "./spotlight-layout";
import {
  getTickerReservedBox,
  pickTickerFlyoverLane,
  pickTickerFlyoverLaneOffset,
} from "./spotlight-ticker-lanes";
import { computeTickerDodge } from "./spotlight-ticker-dodge";
import { computeWaveDrift } from "./spotlight-wave-drift";
import { SpotlightNode } from "./spotlight-node";
import type { SpotlightNodeHoverPos } from "./spotlight-node";

type SpotlightWordCloudProps = {
  positioned: PositionedSpotlightNode[];
  /** True once the roster is wide enough to need the scrolling belt (see `spotlight-layout.ts`'s `MAX_STATIC_NODES`). */
  scrolling: boolean;
  /** Width of one belt tile — only meaningful while `scrolling`. */
  beltWidth: number;
  /** Current scroll offset in `[0, beltWidth)`, from `use-belt-scroll.ts`. */
  beltOffset: number;
  /** Monotonic elapsed time from the same hook — drives each node's wave drift with no seam at the offset's wrap point. */
  elapsedSeconds: number;
  zoom: number;
  isMatch: (name: string) => boolean;
  onHover: (node: PositionedSpotlightNode | null, clientPos: SpotlightNodeHoverPos | null) => void;
  onOpenDetail: (lastKudosId: string) => void;
};

/**
 * The SVG word-cloud canvas itself — split out of `spotlight-board.tsx` to
 * keep that file under the project's ~200-line guidance. Renders one belt
 * tile normally, or TWO tiled copies (this one + a duplicate offset by
 * `beltWidth`) under a single scrolling `translate` when the roster is big
 * enough that `spotlight-board.tsx` switched to belt mode — the duplicate is
 * what lets the scroll wrap seamlessly instead of visibly jumping back to 0.
 */
export function SpotlightWordCloud({
  positioned,
  scrolling,
  beltWidth,
  beltOffset,
  elapsedSeconds,
  zoom,
  isMatch,
  onHover,
  onOpenDetail,
}: SpotlightWordCloudProps) {
  const tickerBox = getTickerReservedBox();

  // fix-bug: below `MAX_STATIC_NODES` nothing scrolls, so a node's resting
  // (x, y) IS its screen position — `computeSpotlightLayout` already kept it
  // off `tickerBox` (and the lanes above it) at layout time. Once scrolling,
  // that resting position keeps changing, so its CURRENT on-screen (x, y) —
  // resting x minus the live `beltOffset`, plus its own wave drift (see
  // `spotlight-wave-drift.ts`, what keeps the scroll from reading as flat
  // sideways motion) — is what actually needs checking against the ticker
  // each frame. Only when that current position is near the ticker does it
  // get pulled onto ITS OWN guaranteed-empty flyover lane — a per-node pick
  // via `pickTickerFlyoverLane` (fix-bug: a single shared lane collapsed
  // every simultaneously-transiting sender onto the same y; several lanes
  // picked by hash spread them out instead) — rather than permanently
  // emptying that whole row, or risking a collision with whatever's already
  // resting nearby (see `spotlight-ticker-dodge.ts`).
  const withScrollDodge = (node: PositionedSpotlightNode): PositionedSpotlightNode => {
    const screenX = node.x - beltOffset;
    const wavedY = node.y + computeWaveDrift(node.senderId, elapsedSeconds);
    const laneBox = pickTickerFlyoverLane(node.senderId);
    const laneOffsetY = pickTickerFlyoverLaneOffset(node.senderId);
    const { dx, dy } = computeTickerDodge(screenX, wavedY, tickerBox, laneBox, laneOffsetY);
    return { ...node, x: node.x + dx, y: wavedY + dy };
  };

  const renderNode = (node: PositionedSpotlightNode, key: string) => (
    <SpotlightNode
      key={key}
      node={scrolling ? withScrollDodge(node) : node}
      dimmed={!isMatch(node.fullName)}
      onHover={onHover}
      onClick={(clicked) => onOpenDetail(clicked.lastKudosId)}
    />
  );

  return (
    <svg
      className="h-full w-full touch-none"
      viewBox={`${-CANVAS_WIDTH / 2} ${-CANVAS_HEIGHT / 2} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      role="img"
      aria-label="Sender spotlight canvas"
    >
      <g transform={`scale(${zoom})`}>
        <g transform={scrolling ? `translate(${-beltOffset}, 0)` : undefined}>
          {positioned.map((node) => renderNode(node, node.senderId))}
          {scrolling &&
            positioned.map((node) => renderNode({ ...node, x: node.x + beltWidth }, `${node.senderId}-belt-dup`))}
        </g>
      </g>
    </svg>
  );
}
