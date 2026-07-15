import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HighlightSection } from "./highlight-section";
import type { KudosCardData } from "./kudos-card";

const MESSAGES: Record<string, string> = {
  "common.loading": "Đang tải",
  sectionEyebrow: "Sun* Annual Awards 2025",
  "highlight.heading": "HIGHLIGHT KUDOS",
  "highlight.empty": "Chưa có Kudos nào.",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => MESSAGES[key] ?? key,
}));

vi.mock("./highlight-carousel", () => ({
  HighlightCarousel: ({ cards }: { cards: KudosCardData[] }) => (
    <div data-testid="highlight-carousel-stub">{cards.map((c) => c.title).join(",")}</div>
  ),
}));

vi.mock("./kudos-filters", () => ({
  KudosFilters: () => <div data-testid="kudos-filters-stub" />,
}));

function makeCard(id: string): KudosCardData {
  return {
    id,
    sender: { id: "s-1", fullName: "Sender", avatarUrl: null, department: "CEV1", starRating: 0 },
    isAnonymous: false,
    anonymousDisplayName: null,
    recipient: { id: "r-1", fullName: "Recipient", avatarUrl: null, department: "CEV1", starRating: 0 },
    title: `Title ${id}`,
    content: "<p>content</p>",
    createdAt: "2026-07-15T00:00:00.000Z",
    hashtags: [],
    images: [],
    heartCount: 0,
    likedByMe: false,
  };
}

const baseProps = {
  filters: { hashtagId: null, department: null },
  onFiltersChange: vi.fn(),
  hashtags: [],
  departments: [],
  currentUserId: null,
  onLike: vi.fn(),
  onOpenDetail: vi.fn(),
  onOpenProfile: vi.fn(),
};

describe("HighlightSection", () => {
  it("renders the carousel with no spinner when cards are loaded and not loading", () => {
    render(<HighlightSection {...baseProps} cards={[makeCard("1")]} loading={false} />);

    expect(screen.getByTestId("highlight-carousel-stub")).toBeTruthy();
    expect(screen.queryByLabelText("Đang tải")).toBeNull();
  });

  // fix-bug: switching Hashtag/Department used to instantly swap the whole
  // carousel for a small spinner block — a jarring layout jump even though
  // most filter refetches resolve in well under 250ms.
  it("keeps the carousel mounted (dimmed) while loading, instead of unmounting it", () => {
    render(<HighlightSection {...baseProps} cards={[makeCard("1")]} loading={true} />);

    const stub = screen.getByTestId("highlight-carousel-stub");
    expect(stub).toBeTruthy();
    expect(stub.parentElement?.className).toContain("opacity-50");
  });

  it("does not show a spinner immediately when loading starts (debounced)", () => {
    render(<HighlightSection {...baseProps} cards={[makeCard("1")]} loading={true} />);
    expect(screen.queryByLabelText("Đang tải")).toBeNull();
  });

  it("shows the empty message when there are no cards and not loading", () => {
    render(<HighlightSection {...baseProps} cards={[]} loading={false} />);
    expect(screen.getByText("Chưa có Kudos nào.")).toBeTruthy();
  });

  it("shows neither the empty message nor a spinner immediately on a cold load with no cards yet", () => {
    render(<HighlightSection {...baseProps} cards={[]} loading={true} />);
    expect(screen.queryByText("Chưa có Kudos nào.")).toBeNull();
    expect(screen.queryByLabelText("Đang tải")).toBeNull();
  });
});
