"use client";

import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { PositionedSpotlightNode } from "./spotlight-layout";
import {
  hashSeed,
  LETTER_SPACING_TO_FONT_SIZE_RATIO,
  LINE_HEIGHT_TO_FONT_SIZE_RATIO,
  nameBoxSize,
} from "./spotlight-layout";

/** Spreads each node's float animation out of sync with the others — a deterministic slice of its own position hash, never `Math.random()`. */
const FLOAT_ANIMATION_PERIOD_SECONDS = 6;

export type SpotlightNodeHoverPos = { x: number; y: number };

type SpotlightNodeProps = {
  node: PositionedSpotlightNode;
  /** True when an active search query doesn't match this node's name. */
  dimmed: boolean;
  onHover: (node: PositionedSpotlightNode | null, clientPos: SpotlightNodeHoverPos | null) => void;
  onClick: (node: PositionedSpotlightNode) => void;
};

/**
 * One recipient name in the Spotlight word-cloud. Renders as an SVG <text>
 * positioned/sized by spotlight-layout.ts, backed by an invisible hit-area
 * rect (estimated from character count) so hover/click don't require
 * pixel-perfect aim at the glyphs themselves. Uses the SAME sizing factors
 * `spotlight-layout.ts` used for its collision boxes, so the visible hit
 * area always matches what the layout engine already kept clear.
 */
export function SpotlightNode({ node, dimmed, onHover, onClick }: SpotlightNodeProps) {
  const { width: hitWidth, height: hitHeight } = nameBoxSize(node.fullName, node.fontSize);
  // Deterministic negative delay so playback starts already offset into the
  // loop (rather than every node starting from the same phase at mount).
  const floatDelaySeconds = -((hashSeed(node.senderId) % 1000) / 1000) * FLOAT_ANIMATION_PERIOD_SECONDS;

  const reportHover = (event: ReactPointerEvent<SVGGElement>) => {
    onHover(node, { x: event.clientX, y: event.clientY });
  };

  const handleKeyDown = (event: ReactKeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(node);
    }
  };

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onPointerEnter={reportHover}
      onPointerMove={reportHover}
      onPointerLeave={() => onHover(null, null)}
      onClick={() => onClick(node)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={node.fullName}
      className="cursor-pointer outline-none"
    >
      <rect x={-hitWidth / 2} y={-hitHeight / 2} width={hitWidth} height={hitHeight} fill="transparent" />
      {/* Float animation lives on this INNER <g>, never the outer one —
         the outer <g>'s `translate(x, y)` is what the hit-rect above and
         the layout engine's collision math both assume is the node's true
         position; animating a SEPARATE inner layer keeps hover/click
         accurate while still visually drifting the text a few px. */}
      <g className="animate-spotlight-float" style={{ animationDelay: `${floatDelaySeconds}s` }}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={node.fontSize}
          style={{
            fill: dimmed
              ? "var(--details-text-secondary-2)"
              : node.isTop
                ? "var(--details-spotlight-highlight)"
                : "var(--details-text-secondary-1)",
            // Momorph spec (7.94px tier: line-height 6.36px, letter-spacing
            // 0.21px) expressed as ratios of font-size so every tier —
            // MIN_FONT_SIZE..MAX_FONT_SIZE — keeps the same proportions.
            lineHeight: `${node.fontSize * LINE_HEIGHT_TO_FONT_SIZE_RATIO}px`,
            letterSpacing: `${node.fontSize * LETTER_SPACING_TO_FONT_SIZE_RATIO}px`,
          }}
          className={`select-none font-montserrat font-bold transition-opacity duration-150 ${
            dimmed ? "opacity-30" : "opacity-100"
          }`}
        >
          {node.fullName}
        </text>
      </g>
    </g>
  );
}
