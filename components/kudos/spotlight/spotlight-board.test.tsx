import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SpotlightBoard } from "./spotlight-board";
import type { SpotlightData } from "./spotlight-board";
import { MAX_STATIC_NODES } from "./spotlight-layout";

// Mirrors the relevant `KudosLiveBoard` message keys this component reads,
// with `{param}` substitution — so existing literal-text assertions below
// keep passing after the copy moved into next-intl, without asserting on
// raw i18n keys (matching the messages/vi.json content, not the mock convention
// used by simpler components elsewhere in this codebase).
const MESSAGES: Record<string, string> = {
  "common.loading": "Đang tải",
  "sectionEyebrow": "Sun* Annual Awards 2025",
  "spotlight.heading": "SPOTLIGHT BOARD",
  "spotlight.empty": "Chưa có dữ liệu",
  "spotlight.searchPlaceholder": "Tìm kiếm",
  "spotlight.searchAriaLabel": "Tìm kiếm sunner",
  "spotlight.totalLabel": "{count} KUDOS",
  "spotlight.expandView": "Phóng to toàn màn hình",
  "spotlight.collapseView": "Thoát toàn màn hình",
  "spotlight.activityNotice": "{name} đã nhận được một Kudos mới",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) => {
    const template = MESSAGES[key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce(
      (text, [paramKey, value]) => text.replace(`{${paramKey}}`, String(value)),
      template
    );
  },
}));

// jsdom has no matchMedia — stub it so the mobile-font-scale detection
// (`spotlight-board.tsx`) doesn't throw. Always reports "not mobile"; the
// desktop/mobile font-scale split itself is covered at the pure-function
// level by `spotlight-layout.test.tsx`'s `fontScale` cases.
window.matchMedia =
  window.matchMedia ??
  ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

const baseData: SpotlightData = {
  totalKudos: 388,
  nodes: [
    {
      senderId: "r-1",
      fullName: "Đỗ Hoàng Hiệp",
      avatarUrl: null,
      sentCount: 40,
      lastSentAt: "2026-07-10T20:30:00.000Z",
      lastKudosId: "kudos-1",
    },
    {
      senderId: "r-2",
      fullName: "Dương Thúy An",
      avatarUrl: null,
      sentCount: 12,
      lastSentAt: "2026-07-09T09:00:00.000Z",
      lastKudosId: "kudos-2",
    },
    {
      senderId: "r-3",
      fullName: "Mai Phương Thúy",
      avatarUrl: null,
      sentCount: 3,
      lastSentAt: "2026-07-08T15:15:00.000Z",
      lastKudosId: "kudos-3",
    },
  ],
  recentActivity: [
    { kudosId: "kudos-1", recipientId: "rc-1", fullName: "Đỗ Hoàng Hiệp", receivedAt: "2026-07-10T20:30:00.000Z" },
    { kudosId: "kudos-2", recipientId: "rc-2", fullName: "Dương Thúy An", receivedAt: "2026-07-09T09:00:00.000Z" },
    { kudosId: "kudos-3", recipientId: "rc-3", fullName: "Mai Phương Thúy", receivedAt: "2026-07-08T15:15:00.000Z" },
  ],
};

describe("SpotlightBoard", () => {
  it("shows a loading placeholder and no nodes while loading", () => {
    render(<SpotlightBoard data={baseData} loading onOpenDetail={vi.fn()} />);

    expect(screen.getByLabelText("Đang tải")).toBeTruthy();
    expect(screen.queryByText("Đỗ Hoàng Hiệp")).toBeNull();
  });

  it("shows the empty state when there are no nodes", () => {
    render(<SpotlightBoard data={{ totalKudos: 0, nodes: [], recentActivity: [] }} onOpenDetail={vi.fn()} />);

    expect(screen.getByText("Chưa có dữ liệu")).toBeTruthy();
  });

  it("renders the total-kudos header and every sender node", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    expect(screen.getByText("388 KUDOS")).toBeTruthy();
    expect(screen.getByText("Đỗ Hoàng Hiệp")).toBeTruthy();
    expect(screen.getByText("Dương Thúy An")).toBeTruthy();
    expect(screen.getByText("Mai Phương Thúy")).toBeTruthy();
  });

  it("renders the SPOTLIGHT BOARD section heading", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    expect(screen.getByText("SPOTLIGHT BOARD")).toBeTruthy();
  });

  it("shows a recent-activity ticker line for the most recently received item", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    // kudos-1 (2026-07-10) is the most recent of the three `baseData` activity items —
    // asserting on the surrounding copy only, not the clock digits, since
    // the formatter reads local time (matches the existing tooltip
    // formatter's convention) and would be flaky across timezones.
    expect(
      screen.getByText((content) => content.includes("Đỗ Hoàng Hiệp") && content.includes("đã nhận được một Kudos mới"))
    ).toBeTruthy();
  });

  it("positions the canvas content wrapper so it paints above the background images (fix-bug regression)", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    // A non-positioned (`static`) element ALWAYS paints below `position:
    // absolute` siblings, regardless of DOM order — the two background
    // Images are `absolute` (via next/image `fill`), so this wrapper
    // dropping `relative` is exactly what hid the whole word-cloud/ticker/
    // controls behind them. jsdom doesn't compute real paint order, so this
    // pins the class that CSS depends on rather than the visual outcome.
    const canvas = screen.getByRole("img", { name: "Sender spotlight canvas" });
    const wrapper = canvas.closest("div");
    expect(wrapper?.className).toContain("relative");
  });

  it("prevents page-scroll on wheel over the canvas (fix-bug regression)", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    // A React `onWheel={...}` prop can't stop page-scroll — React registers
    // `wheel` as a PASSIVE listener at the root, so `preventDefault()` inside
    // a synthetic handler is silently ignored there too (not browser-only
    // behavior). Only a real `{ passive: false }` `addEventListener` call
    // actually blocks it, which is what this pins: dispatch a genuine,
    // cancelable WheelEvent and check the browser-level `defaultPrevented`
    // flag, not just that some handler ran.
    const region = screen.getByRole("region", { name: "Spotlight board" });
    const canvasWrapper = region.children[1] as HTMLElement;
    const wheelEvent = new WheelEvent("wheel", { cancelable: true, bubbles: true, deltaY: 10 });
    canvasWrapper.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it("calls onOpenDetail with the clicked node's lastKudosId", () => {
    const onOpenDetail = vi.fn();
    render(<SpotlightBoard data={baseData} onOpenDetail={onOpenDetail} />);

    fireEvent.click(screen.getByText("Dương Thúy An"));

    expect(onOpenDetail).toHaveBeenCalledWith("kudos-2");
  });

  it("expands to fullscreen on click, then collapses back on a second click", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    // Same `containerRef` div the wheel-handling test below anchors to.
    const container = () => screen.getByRole("region", { name: "Spotlight board" }).children[1] as HTMLElement;
    expect(container().className).not.toContain("fixed");

    fireEvent.click(screen.getByLabelText("Phóng to toàn màn hình"));
    expect(container().className).toContain("fixed");
    expect(screen.getByLabelText("Thoát toàn màn hình")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Thoát toàn màn hình"));
    expect(container().className).not.toContain("fixed");
  });

  it("exits fullscreen on Escape", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    fireEvent.click(screen.getByLabelText("Phóng to toàn màn hình"));
    expect(screen.getByLabelText("Thoát toàn màn hình")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByLabelText("Phóng to toàn màn hình")).toBeTruthy();
  });

  it("caps the search input at 100 characters", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    const input = screen.getByPlaceholderText("Tìm kiếm") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "a".repeat(150) } });

    expect(input.value).toHaveLength(100);
  });

  it("switches to the scrolling belt (duplicated tile) once the roster exceeds MAX_STATIC_NODES", () => {
    const bigRoster: SpotlightData = {
      totalKudos: 1000,
      nodes: Array.from({ length: MAX_STATIC_NODES + 10 }, (_, i) => ({
        senderId: `r-${i}`,
        fullName: `Recipient ${i}`,
        avatarUrl: null,
        sentCount: i,
        lastSentAt: "2026-07-10T20:30:00.000Z",
        lastKudosId: `kudos-${i}`,
      })),
      recentActivity: [],
    };

    render(<SpotlightBoard data={bigRoster} onOpenDetail={vi.fn()} />);

    // Belt mode renders every node twice (this tile + the seamless duplicate
    // tile) so the scroll never visibly jumps when it wraps.
    expect(screen.getAllByText("Recipient 0")).toHaveLength(2);
  });

  it("does NOT duplicate nodes when the roster is at or below MAX_STATIC_NODES", () => {
    const roster: SpotlightData = {
      totalKudos: 100,
      nodes: Array.from({ length: MAX_STATIC_NODES }, (_, i) => ({
        senderId: `r-${i}`,
        fullName: `Recipient ${i}`,
        avatarUrl: null,
        sentCount: i,
        lastSentAt: "2026-07-10T20:30:00.000Z",
        lastKudosId: `kudos-${i}`,
      })),
      recentActivity: [],
    };

    render(<SpotlightBoard data={roster} onOpenDetail={vi.fn()} />);

    expect(screen.getAllByText("Recipient 0")).toHaveLength(1);
  });

  it("dims nodes that don't match the search query without removing them", () => {
    render(<SpotlightBoard data={baseData} onOpenDetail={vi.fn()} />);

    const input = screen.getByPlaceholderText("Tìm kiếm");
    fireEvent.change(input, { target: { value: "Hiệp" } });

    const matched = screen.getByText("Đỗ Hoàng Hiệp");
    const unmatched = screen.getByText("Dương Thúy An");

    expect(matched.getAttribute("class")).toContain("opacity-100");
    expect(unmatched.getAttribute("class")).toContain("opacity-30");
  });
});
