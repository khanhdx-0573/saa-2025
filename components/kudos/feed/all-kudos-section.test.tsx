import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AllKudosSection } from "./all-kudos-section";
import type { KudosCardData } from "./kudos-card";

const MESSAGES: Record<string, string> = {
  "common.loading": "Đang tải",
  sectionEyebrow: "Sun* Annual Awards 2025",
  "allKudos.heading": "ALL KUDOS",
  "allKudos.empty": "Chưa có Kudos nào.",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => MESSAGES[key] ?? key,
}));

vi.mock("./kudos-card", () => ({
  KudosCard: ({ card }: { card: KudosCardData }) => <div data-testid="kudos-card-stub">{card.title}</div>,
}));

vi.mock("./kudos-edit-modal", () => ({
  KudosEditModal: () => null,
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
  currentUserId: null,
  unknownUserLabel: "Unknown",
  onOpenDetail: vi.fn(),
  onOpenProfile: vi.fn(),
};

describe("AllKudosSection", () => {
  it("renders cards with no spinner once the initial fetch resolves", async () => {
    const fetchPage = vi.fn().mockResolvedValue([makeCard("1")]);
    render(<AllKudosSection {...baseProps} fetchPage={fetchPage} />);

    await waitFor(() => expect(screen.getByTestId("kudos-card-stub")).toBeTruthy());
    expect(screen.queryByLabelText("Đang tải")).toBeNull();
  });

  // fix-bug: switching Hashtag/Department used to instantly swap the whole
  // list for a small spinner block — a jarring layout jump even though most
  // filter refetches resolve in well under 250ms.
  it("keeps existing cards visible (dimmed) while a filter-triggered refetch is in flight", async () => {
    let resolvePage: (cards: KudosCardData[]) => void = () => {};
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce([makeCard("1")])
      .mockImplementationOnce(() => new Promise((resolve) => (resolvePage = resolve)));

    const { rerender } = render(<AllKudosSection {...baseProps} fetchPage={fetchPage} />);
    await waitFor(() => expect(screen.getByTestId("kudos-card-stub")).toBeTruthy());

    rerender(<AllKudosSection {...baseProps} filters={{ hashtagId: 1, department: null }} fetchPage={fetchPage} />);

    // Old card stays mounted and dimmed — never unmounted for a spinner.
    await waitFor(() => expect(screen.getByTestId("kudos-card-stub").parentElement?.className).toContain("opacity-50"));

    await act(async () => resolvePage([makeCard("2")]));
    await waitFor(() => expect(screen.getByText("Title 2")).toBeTruthy());
  });

  it("shows the empty message when there are no cards and not loading", async () => {
    const fetchPage = vi.fn().mockResolvedValue([]);
    render(<AllKudosSection {...baseProps} fetchPage={fetchPage} />);

    await waitFor(() => expect(screen.getByText("Chưa có Kudos nào.")).toBeTruthy());
  });
});
