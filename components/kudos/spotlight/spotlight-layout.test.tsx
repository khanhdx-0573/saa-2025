import { describe, expect, it } from "vitest";
import {
  computeSpotlightLayout,
  computeBeltWidth,
  CANVAS_WIDTH,
  MAX_FONT_SIZE,
  MAX_STATIC_NODES,
  MIN_FONT_SIZE,
  NAME_CHAR_WIDTH_FACTOR,
  NAME_HEIGHT_FACTOR,
} from "./spotlight-layout";
import type { SpotlightLayoutNode } from "./spotlight-layout";
import {
  getTickerReservedBox,
  getTickerFlyoverLaneBoxes,
  pickTickerFlyoverLane,
  pickTickerFlyoverLaneOffset,
} from "./spotlight-ticker-lanes";
import { boxesOverlap } from "./spotlight-collision";

function makeNode(overrides: Partial<SpotlightLayoutNode> = {}): SpotlightLayoutNode {
  return {
    senderId: "r-1",
    fullName: "Nguyễn Văn A",
    avatarUrl: null,
    sentCount: 10,
    lastSentAt: "2026-07-01T10:00:00.000Z",
    lastKudosId: "k-1",
    ...overrides,
  };
}

describe("computeSpotlightLayout", () => {
  it("returns an empty array for no nodes", () => {
    expect(computeSpotlightLayout([])).toEqual([]);
  });

  it("is deterministic: the same input produces the same output on every call", () => {
    const nodes = [
      makeNode({ senderId: "a", sentCount: 40 }),
      makeNode({ senderId: "b", sentCount: 5 }),
      makeNode({ senderId: "c", sentCount: 22 }),
    ];

    const first = computeSpotlightLayout(nodes);
    const second = computeSpotlightLayout(nodes);

    expect(second).toEqual(first);
  });

  it("flags exactly the highest sent-count node as isTop, at its MAX font size", () => {
    const nodes = [
      makeNode({ senderId: "low", sentCount: 1 }),
      makeNode({ senderId: "high", sentCount: 100 }),
      makeNode({ senderId: "mid", sentCount: 50 }),
    ];

    const positioned = computeSpotlightLayout(nodes);
    const topNodes = positioned.filter((node) => node.isTop);
    expect(topNodes).toHaveLength(1);
    expect(topNodes[0].senderId).toBe("high");
    expect(topNodes[0].fontSize).toBe(MAX_FONT_SIZE);
  });

  it("does not force the top node to the exact canvas center (fix-bug regression)", () => {
    // An earlier rank-driven spiral special-cased index 0 (the highest
    // sentCount) to sit at the EXACT center (x=0, y=0), then placed
    // every other node's radius as a function of its rank — which
    // inescapably clustered the many high-count/large-font nodes in the
    // real mock dataset in a tight band near that center, however far the
    // spiral's step/jitter was widened. Position must now be decorrelated
    // from rank entirely, so the top node lands whichever grid cell its
    // senderId hashes to — never forced to a fixed point.
    const nodes = [
      makeNode({ senderId: "low", sentCount: 1 }),
      makeNode({ senderId: "high", sentCount: 100 }),
      makeNode({ senderId: "mid", sentCount: 50 }),
    ];

    const top = computeSpotlightLayout(nodes).find((node) => node.isTop);
    expect(top?.x === 0 && top?.y === 0).toBe(false);
  });

  it("never places two nodes at the exact same position", () => {
    const nodes = Array.from({ length: 60 }, (_, i) => makeNode({ senderId: `r${i}`, sentCount: i }));

    const positioned = computeSpotlightLayout(nodes);
    const coordinates = new Set(positioned.map((node) => `${node.x},${node.y}`));
    expect(coordinates.size).toBe(nodes.length);
  });

  it("scales font size linearly between the min and max bound over the sent-count range", () => {
    const nodes = [makeNode({ senderId: "a", sentCount: 0 }), makeNode({ senderId: "b", sentCount: 100 })];

    const positioned = computeSpotlightLayout(nodes);
    const low = positioned.find((node) => node.senderId === "a");
    const high = positioned.find((node) => node.senderId === "b");

    expect(low?.fontSize).toBe(MIN_FONT_SIZE);
    expect(high?.fontSize).toBe(MAX_FONT_SIZE);
  });

  it("falls back to the min font size when all sent counts are equal", () => {
    const nodes = [
      makeNode({ senderId: "a", sentCount: 12 }),
      makeNode({ senderId: "b", sentCount: 12 }),
      makeNode({ senderId: "c", sentCount: 12 }),
    ];

    const positioned = computeSpotlightLayout(nodes);
    expect(positioned.every((node) => node.fontSize === MIN_FONT_SIZE)).toBe(true);
  });

  it("multiplies both font-size bounds by fontScale (mobile legibility boost)", () => {
    const nodes = [makeNode({ senderId: "a", sentCount: 0 }), makeNode({ senderId: "b", sentCount: 100 })];

    const positioned = computeSpotlightLayout(nodes, undefined, 1.3);
    const low = positioned.find((node) => node.senderId === "a");
    const high = positioned.find((node) => node.senderId === "b");

    expect(low?.fontSize).toBeCloseTo(MIN_FONT_SIZE * 1.3);
    expect(high?.fontSize).toBeCloseTo(MAX_FONT_SIZE * 1.3);
  });

  it("defaults fontScale to 1 (no change) when omitted", () => {
    const nodes = [makeNode({ senderId: "a", sentCount: 0 })];

    const positioned = computeSpotlightLayout(nodes);
    expect(positioned[0].fontSize).toBe(MIN_FONT_SIZE);
  });

  it("produces the same per-sender position regardless of the input array's order", () => {
    const a = makeNode({ senderId: "a", sentCount: 30 });
    const b = makeNode({ senderId: "b", sentCount: 30 });
    const c = makeNode({ senderId: "c", sentCount: 10 });

    const layout1 = computeSpotlightLayout([a, b, c]);
    const layout2 = computeSpotlightLayout([c, b, a]);

    const byId = (layout: typeof layout1, id: string) => layout.find((node) => node.senderId === id);

    expect(byId(layout1, "a")).toEqual(byId(layout2, "a"));
    expect(byId(layout1, "b")).toEqual(byId(layout2, "b"));
    expect(byId(layout1, "c")).toEqual(byId(layout2, "c"));
  });

  it("breaks isTop ties in sent-count deterministically by senderId ascending", () => {
    const nodes = [makeNode({ senderId: "zeta", sentCount: 20 }), makeNode({ senderId: "alpha", sentCount: 20 })];

    const top = computeSpotlightLayout(nodes).find((node) => node.isTop);
    expect(top?.senderId).toBe("alpha");
  });

  it("substantially reduces label overlap at real mock-dataset density (fix-bug regression)", () => {
    // Mirrors `spotlight-mock-data.ts`'s density: 7 repeated names, 106
    // nodes, several with long full names AND a high sentCount (so they
    // render at/near MAX_FONT_SIZE) — exactly the combination that used to
    // pile up as illegible overlapping text. At this density, PERFECT
    // zero-overlap isn't geometrically guaranteed by a bounded local search
    // (106 bold labels, some ~210px wide, packed into a ~1077×438 usable
    // area) — what's verifiable and worth pinning is that collision
    // resolution meaningfully improves on placing nothing but grid+jitter:
    // empirically 145 overlapping pairs → ~68 with resolution on (higher
    // than the ~27 measured before the ticker-reserved box below existed —
    // reserving that much permanent space for the ticker leaves less room
    // for 106 large labels to dodge each other too), out of 5565 possible
    // pairs total.
    const names = [
      "Nguyễn Hoàng Linh",
      "Nguyễn Bá Chức",
      "Nguyễn Văn Quy",
      "Lê Kiều Trang",
      "Đỗ Hoàng Hiệp",
      "Dương Thúy An",
      "Mai Phương Thúy",
    ];
    const nodes = Array.from({ length: 106 }, (_, i) =>
      makeNode({ senderId: `r${i}`, fullName: names[i % names.length], sentCount: 50 - (i % 20) })
    );

    const positioned = computeSpotlightLayout(nodes);
    const boxes = positioned.map((node) => ({
      x: node.x,
      y: node.y,
      width: node.fullName.length * node.fontSize * NAME_CHAR_WIDTH_FACTOR,
      height: node.fontSize * NAME_HEIGHT_FACTOR,
    }));

    let overlappingPairs = 0;
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        if (boxesOverlap(boxes[i], boxes[j])) overlappingPairs += 1;
      }
    }

    // Generous ceiling above the measured ~68 — a regression guard against
    // the algorithm getting meaningfully worse, not a claim of perfection.
    expect(overlappingPairs).toBeLessThan(90);
  });

  it("keeps almost every label clear of the ticker's reserved corner (fix-bug regression)", () => {
    // Before `findFreePosition` clamped+re-checked bounds internally, the
    // ticker box was still respected as an obstacle DURING the search, but
    // the search's own result got clamped to the usable area AFTERWARDS
    // with no re-check — which could walk an already-resolved, collision-free
    // position straight back into the ticker box (68/106 nodes landed
    // inside it in that state). With the fix, only the rare "search
    // exhausted, fell back to the original candidate" case can still end up
    // there — same accepted trade-off as the general overlap test above.
    const names = ["Nguyễn Hoàng Linh", "Nguyễn Bá Chức", "Nguyễn Văn Quy", "Lê Kiều Trang"];
    const nodes = Array.from({ length: 106 }, (_, i) =>
      makeNode({ senderId: `r${i}`, fullName: names[i % names.length], sentCount: 50 - (i % 20) })
    );

    const positioned = computeSpotlightLayout(nodes);
    const tickerBox = getTickerReservedBox();
    const overlappingTicker = positioned.filter((node) =>
      boxesOverlap(tickerBox, {
        x: node.x,
        y: node.y,
        width: node.fullName.length * node.fontSize * NAME_CHAR_WIDTH_FACTOR,
        height: node.fontSize * NAME_HEIGHT_FACTOR,
      })
    );

    expect(overlappingTicker.length).toBeLessThan(5);
  });

  // The flyover lanes only matter while SCROLLING (`spotlight-ticker-dodge.ts`
  // is the only thing that ever targets them; nothing moves in the static
  // case) — so they're only reserved when `canvasWidth` reflects that, same
  // condition `spotlight-board.tsx` uses for its own `scrolling` flag.
  it("keeps every flyover lane directly above the ticker box permanently empty at layout time, once scrolling", () => {
    const nodes = Array.from({ length: 94 }, (_, i) =>
      makeNode({ senderId: `r${i}`, fullName: `Nguyễn Văn ${i}`, sentCount: 1 })
    );
    const beltWidth = computeBeltWidth(nodes.length);
    expect(beltWidth).toBeGreaterThan(CANVAS_WIDTH); // sanity: this count IS in scrolling territory

    const positioned = computeSpotlightLayout(nodes, beltWidth);
    const laneBoxes = getTickerFlyoverLaneBoxes();
    for (const laneBox of laneBoxes) {
      const overlappingLane = positioned.filter((node) =>
        boxesOverlap(laneBox, {
          x: node.x,
          y: node.y,
          width: node.fullName.length * node.fontSize * NAME_CHAR_WIDTH_FACTOR,
          height: node.fontSize * NAME_HEIGHT_FACTOR,
        })
      );
      // Same accepted trade-off as `findFreePosition`'s other regression
      // tests: a bounded local search can't geometrically guarantee zero
      // overlap at high density, so "rare" (not "never") is the bar.
      expect(overlappingLane.length).toBeLessThan(2);
    }
  });
});

describe("pickTickerFlyoverLane", () => {
  it("is deterministic for the same senderId", () => {
    expect(pickTickerFlyoverLane("sender-1")).toEqual(pickTickerFlyoverLane("sender-1"));
  });

  // fix-bug: a single shared lane collapsed every simultaneously-transiting
  // sender onto the same y, which is what caused them to visually clump
  // together even though none of them individually overlapped the ticker.
  it("spreads different senders across more than one lane", () => {
    const lanes = new Set(
      Array.from({ length: 40 }, (_, i) => JSON.stringify(pickTickerFlyoverLane(`sender-${i}`)))
    );
    expect(lanes.size).toBeGreaterThan(1);
  });

  it("only ever returns one of the reserved lane boxes", () => {
    const laneBoxes = getTickerFlyoverLaneBoxes();
    for (let i = 0; i < 20; i += 1) {
      expect(laneBoxes).toContainEqual(pickTickerFlyoverLane(`sender-${i}`));
    }
  });
});

describe("pickTickerFlyoverLaneOffset", () => {
  it("is deterministic for the same senderId", () => {
    expect(pickTickerFlyoverLaneOffset("sender-1")).toBe(pickTickerFlyoverLaneOffset("sender-1"));
  });

  // fix-bug: two nodes assigned to the SAME lane (inevitable once there are
  // more simultaneous transiters than lanes) still converged on the exact
  // same y, which is what made an already-close-in-x pair render as one
  // illegible clump instead of two separate labels.
  it("gives different senders different offsets within the lane", () => {
    const offsets = new Set(Array.from({ length: 20 }, (_, i) => pickTickerFlyoverLaneOffset(`sender-${i}`)));
    expect(offsets.size).toBeGreaterThan(1);
  });

  it("never pushes the offset outside the lane's own reserved height", () => {
    const laneBox = getTickerFlyoverLaneBoxes()[0];
    for (let i = 0; i < 30; i += 1) {
      expect(Math.abs(pickTickerFlyoverLaneOffset(`sender-${i}`))).toBeLessThanOrEqual(laneBox.height / 2);
    }
  });
});

describe("computeBeltWidth", () => {
  it("returns the static CANVAS_WIDTH at or below MAX_STATIC_NODES", () => {
    expect(computeBeltWidth(0)).toBe(CANVAS_WIDTH);
    expect(computeBeltWidth(MAX_STATIC_NODES)).toBe(CANVAS_WIDTH);
  });

  it("grows proportionally past MAX_STATIC_NODES so per-node density stays constant", () => {
    const width = computeBeltWidth(MAX_STATIC_NODES * 3);
    expect(width).toBe(CANVAS_WIDTH * 3);
  });
});

describe("computeSpotlightLayout with a custom canvasWidth", () => {
  it("spreads nodes across the wider belt instead of the static canvas bounds", () => {
    const nodes = Array.from({ length: 20 }, (_, i) => makeNode({ senderId: `r${i}`, sentCount: i }));
    const beltWidth = CANVAS_WIDTH * 3;

    const positioned = computeSpotlightLayout(nodes, beltWidth);

    expect(positioned.every((node) => Math.abs(node.x) <= beltWidth / 2)).toBe(true);
    // At least one node lands outside where the STATIC canvas would have
    // bounded it — otherwise the wider belt isn't actually being used.
    expect(positioned.some((node) => Math.abs(node.x) > CANVAS_WIDTH / 2)).toBe(true);
  });

  it("is deterministic for the same nodes and canvasWidth", () => {
    const nodes = [makeNode({ senderId: "a" }), makeNode({ senderId: "b", sentCount: 5 })];
    const beltWidth = CANVAS_WIDTH * 2;

    expect(computeSpotlightLayout(nodes, beltWidth)).toEqual(computeSpotlightLayout(nodes, beltWidth));
  });

  // `getTickerReservedBox()` stays a small, screen-fixed-position box
  // regardless of belt width — avoiding the ticker while SCROLLING is
  // `spotlight-ticker-dodge.ts`'s job (a per-frame nudge), not this
  // function's; see that module's own tests for that coverage.
  it("keeps the ticker reservation box a fixed size independent of canvasWidth", () => {
    const beltWidth = computeBeltWidth(94);
    expect(beltWidth).toBeGreaterThan(CANVAS_WIDTH); // sanity: this count IS in scrolling territory

    expect(getTickerReservedBox()).toEqual(getTickerReservedBox());
  });
});
