/**
 * Pure, deterministic layout engine for the Spotlight word-cloud — no React,
 * so it's trivially unit-testable.
 *
 * Font size scales linearly with `sentCount`, but a node's POSITION is fully
 * decorrelated from sentCount/rank: the usable area is a jittered grid, each
 * node assigned a cell by `hashSeed(senderId)`. An earlier rank-driven spiral
 * clustered every large-font node near the center — which the real design
 * never does — so don't reintroduce any rank→position link.
 *
 * Cells are assigned over senders sorted by senderId (canonical order), NOT
 * input order, so a node's position is stable regardless of array order. All
 * "randomness" is a djb2 hash of senderId, never `Math.random()`, so layout is
 * identical across re-renders. A second `findFreePosition` pass resolves the
 * overlaps the grid can't (long labels spanning past one cell) and keeps every
 * label off the ticker's reserved boxes.
 */
import { findFreePosition, type Box, type Bounds } from "./spotlight-collision";
import { getTickerReservedBox, getTickerFlyoverLaneBoxes } from "./spotlight-ticker-lanes";

export type SpotlightLayoutNode = {
  senderId: string;
  fullName: string;
  avatarUrl: string | null;
  sentCount: number;
  lastSentAt: string;
  lastKudosId: string;
};

export type PositionedSpotlightNode = SpotlightLayoutNode & {
  /** Canvas-space coordinates, relative to the canvas's own center (0, 0). */
  x: number;
  y: number;
  /** Resolved font size in px, already scaled for this node's sentCount. */
  fontSize: number;
  /** True for exactly one node: the highest `sentCount`, rendered in accent color. */
  isTop: boolean;
};

/** Matches the SVG `viewBox` in `spotlight-board.tsx` — single source of truth for both. */
export const CANVAS_WIDTH = 1157;
export const CANVAS_HEIGHT = 548;

/**
 * Above this many nodes, `computeBeltWidth` grows a wider virtual belt
 * (scrolled by `spotlight-board.tsx`) instead of cramming everyone into the
 * fixed canvas — keeping per-node density, and so overlap, roughly constant.
 */
export const MAX_STATIC_NODES = 50;

/** Width of one repeating belt tile: `CANVAS_WIDTH` up to `MAX_STATIC_NODES`, then widened proportionally so each node keeps the same room. */
export function computeBeltWidth(nodeCount: number): number {
  if (nodeCount <= MAX_STATIC_NODES) return CANVAS_WIDTH;
  return Math.round(CANVAS_WIDTH * (nodeCount / MAX_STATIC_NODES));
}

// Range measured off B.7's ~106 real name labels. Label box area scales with
// the SQUARE of font size, so an inflated ceiling dominates overlap/crowding.
export const MIN_FONT_SIZE = 6.66;
export const MAX_FONT_SIZE = 11.34;
/** Momorph spec: line-height 6.36px at the 6.66px tier → ~0.955 of font-size, applied proportionally at every tier. */
export const LINE_HEIGHT_TO_FONT_SIZE_RATIO = 6.36 / 6.66;
/** Momorph spec: letter-spacing 0.21px at the 6.66px tier → ~3.15% of font-size, applied proportionally at every tier. */
export const LETTER_SPACING_TO_FONT_SIZE_RATIO = 0.21 / 6.66;

/** Rough average glyph width for bold Montserrat — used for both the collision boxes below and `SpotlightNode`'s invisible hit-area, so the two stay in sync. */
export const NAME_CHAR_WIDTH_FACTOR = 0.62;
export const NAME_HEIGHT_FACTOR = 1.4;

/** Keeps labels clear of the canvas edges; TOP is taller to clear the "{n} KUDOS" title + search pill. */
const SIDE_MARGIN = 40;
const TOP_MARGIN = 90;
const BOTTOM_MARGIN = 20;
/** Cells outnumber nodes by this factor; the empty slack plus per-cell jitter is what makes placement look scattered, not gridded. */
const CELL_SLACK_FACTOR = 1.35;
/** Max drift from a cell's center, as a fraction of the cell's size — bounded so a node never crosses into a neighboring cell. */
const CELL_JITTER_FRACTION = 0.38;

/** Deterministic djb2-style hash — the only source of "randomness" here, so layout stays stable across re-renders. */
export function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Maps a hash seed to a deterministic value in `[-1, 1)` — the shared basis for every symmetric jitter/offset in the word-cloud. */
export function signedUnitFromSeed(seed: number, buckets: number = 200): number {
  return ((seed % buckets) / buckets - 0.5) * 2;
}

/** Estimated label bounding box — shared with `SpotlightNode`'s hit-area so the layout engine and clickable region never drift apart. */
export function nameBoxSize(fullName: string, fontSize: number): { width: number; height: number } {
  return {
    width: fullName.length * fontSize * NAME_CHAR_WIDTH_FACTOR,
    height: fontSize * NAME_HEIGHT_FACTOR,
  };
}

function fontSizeFor(sentCount: number, min: number, max: number, fontScale: number): number {
  if (max === min) return MIN_FONT_SIZE * fontScale;
  const t = (sentCount - min) / (max - min);
  return (MIN_FONT_SIZE + t * (MAX_FONT_SIZE - MIN_FONT_SIZE)) * fontScale;
}

/** Rows/cols for a grid holding at least `nodeCount * CELL_SLACK_FACTOR` cells, shaped to the usable area's aspect ratio. */
function gridDimensions(nodeCount: number, usableWidth: number, usableHeight: number): { rows: number; cols: number } {
  const targetCells = Math.max(nodeCount, Math.ceil(nodeCount * CELL_SLACK_FACTOR));
  const aspect = usableWidth / usableHeight;
  const rows = Math.max(1, Math.round(Math.sqrt(targetCells / aspect)));
  const cols = Math.max(1, Math.ceil(targetCells / rows));
  return { rows, cols };
}

/**
 * Deterministic canvas positions + font sizes for every node — same input
 * (regardless of element order) yields the same output every call.
 *
 * @param canvasWidth Defaults to `CANVAS_WIDTH` (static layout). Pass a wider
 * value (see `computeBeltWidth`) for scrolling mode; the belt only ever grows
 * horizontally, `CANVAS_HEIGHT` never changes.
 * @param fontScale Multiplies `MIN_FONT_SIZE`/`MAX_FONT_SIZE` uniformly.
 * Collision boxes (`nameBoxSize`) are derived from the SAME scaled font size,
 * so bumping this for mobile (where the SVG canvas gets scaled down further
 * by the narrower container) keeps names legible without desyncing layout
 * spacing from what's actually rendered.
 */
export function computeSpotlightLayout(
  nodes: SpotlightLayoutNode[],
  canvasWidth: number = CANVAS_WIDTH,
  fontScale: number = 1
): PositionedSpotlightNode[] {
  if (nodes.length === 0) return [];

  const counts = nodes.map((node) => node.sentCount);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  const topSenderId = [...nodes].sort((a, b) => {
    if (b.sentCount !== a.sentCount) return b.sentCount - a.sentCount;
    return a.senderId.localeCompare(b.senderId);
  })[0].senderId;

  const usableXMin = -canvasWidth / 2 + SIDE_MARGIN;
  const usableXMax = canvasWidth / 2 - SIDE_MARGIN;
  const usableYMin = -CANVAS_HEIGHT / 2 + TOP_MARGIN;
  const usableYMax = CANVAS_HEIGHT / 2 - BOTTOM_MARGIN;
  const usableWidth = usableXMax - usableXMin;
  const usableHeight = usableYMax - usableYMin;

  const { rows, cols } = gridDimensions(nodes.length, usableWidth, usableHeight);
  const totalCells = rows * cols;
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;

  // Canonical (input-order-independent) processing order for cell assignment.
  const canonicalOrder = [...nodes].sort((a, b) => a.senderId.localeCompare(b.senderId));
  const takenCells = new Set<number>();
  const cellIndexBySenderId = new Map<string, number>();
  for (const node of canonicalOrder) {
    let cellIndex = hashSeed(node.senderId) % totalCells;
    while (takenCells.has(cellIndex)) {
      cellIndex = (cellIndex + 1) % totalCells;
    }
    takenCells.add(cellIndex);
    cellIndexBySenderId.set(node.senderId, cellIndex);
  }

  // Candidate box per node: grid cell center + jitter, sized from its own font/name.
  const candidates = nodes.map((node) => {
    const fontSize = fontSizeFor(node.sentCount, minCount, maxCount, fontScale);
    const cellIndex = cellIndexBySenderId.get(node.senderId)!;
    const row = Math.floor(cellIndex / cols);
    const col = cellIndex % cols;
    const cellCenterX = usableXMin + (col + 0.5) * cellWidth;
    const cellCenterY = usableYMin + (row + 0.5) * cellHeight;

    // Independent hash slices for jitter, so it stays uncorrelated with the picked cell.
    const seed = hashSeed(node.senderId);
    const jitterX = signedUnitFromSeed(seed) * cellWidth * CELL_JITTER_FRACTION;
    const jitterY = signedUnitFromSeed(seed >>> 8) * cellHeight * CELL_JITTER_FRACTION;

    const box: Box = {
      x: cellCenterX + jitterX,
      y: cellCenterY + jitterY,
      ...nameBoxSize(node.fullName, fontSize),
    };
    return { node, fontSize, box, seed };
  });

  // Resolve overlaps biggest-font-first (harder to fit, claims open space
  // first), senderId-tie-broken. This sets only PRIORITY, not start position,
  // so it can't reintroduce the old rank→position correlation.
  const byPriority = [...candidates].sort((a, b) => {
    if (b.fontSize !== a.fontSize) return b.fontSize - a.fontSize;
    return a.node.senderId.localeCompare(b.node.senderId);
  });

  const bounds: Bounds = { xMin: usableXMin, xMax: usableXMax, yMin: usableYMin, yMax: usableYMax };
  // Reserve the flyover lanes only when scrolling — nothing targets them in
  // the static case, so reserving them there would just waste usable area.
  const placedBoxes: Box[] =
    canvasWidth > CANVAS_WIDTH ? [getTickerReservedBox(), ...getTickerFlyoverLaneBoxes()] : [getTickerReservedBox()];
  const resultBySenderId = new Map<string, { fontSize: number; x: number; y: number }>();
  for (const { node, fontSize, box, seed } of byPriority) {
    const { x, y } = findFreePosition(box, placedBoxes, seed, bounds);
    placedBoxes.push({ ...box, x, y });
    resultBySenderId.set(node.senderId, { fontSize, x, y });
  }

  return nodes.map((node) => ({
    ...node,
    ...resultBySenderId.get(node.senderId)!,
    isTop: node.senderId === topSenderId,
  }));
}
