import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { KudosCard } from "./kudos-card";
import type { KudosCardData } from "./kudos-card";

const MESSAGES: Record<string, string> = {
  "card.viewDetail": "Xem chi tiết",
  "card.editButton": "Sửa",
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => MESSAGES[key] ?? key,
}));

const baseCard: KudosCardData = {
  id: "kudos-1",
  sender: { id: "sender-1", fullName: "Người gửi", avatarUrl: null, department: "CEVC10", starRating: 0 },
  isAnonymous: false,
  anonymousDisplayName: null,
  recipient: { id: "recipient-1", fullName: "Người nhận", avatarUrl: null, department: "CEVC10", starRating: 0 },
  title: "IDOL GIỚI TRẺ",
  content: "Cảm ơn bạn rất nhiều.",
  createdAt: "2025-10-30T10:00:00.000Z",
  hashtags: ["Dedicated"],
  images: [],
  heartCount: 10,
  likedByMe: false,
};

const baseProps = {
  card: baseCard,
  detailUrl: "https://example.com/kudos/kudos-1",
  onLike: vi.fn(),
  onOpenDetail: vi.fn(),
  onOpenProfile: vi.fn(),
};

describe("KudosCard", () => {
  it("shows 'Xem chi tiết' on the Highlight-style card (contentLines=3)", () => {
    render(<KudosCard {...baseProps} contentLines={3} showImages={false} />);
    expect(screen.getByText("Xem chi tiết")).toBeTruthy();
  });

  it("does NOT show 'Xem chi tiết' on the All Kudos/Detail-style card (contentLines=5) — Momorph C.4 has no such button", () => {
    render(<KudosCard {...baseProps} contentLines={5} showImages />);
    expect(screen.queryByText("Xem chi tiết")).toBeNull();
  });

  it("does not show the edit button on the Highlight-style card even when canEdit is true", () => {
    render(<KudosCard {...baseProps} contentLines={3} showImages={false} canEdit onEdit={vi.fn()} />);
    expect(screen.queryByLabelText("Sửa")).toBeNull();
  });

  it("does not show the edit button on the All Kudos-style card when canEdit is false", () => {
    render(<KudosCard {...baseProps} contentLines={5} showImages canEdit={false} onEdit={vi.fn()} />);
    expect(screen.queryByLabelText("Sửa")).toBeNull();
  });

  it("shows the edit button on the All Kudos-style card when canEdit is true, and calls onEdit with the kudos id", () => {
    const onEdit = vi.fn();
    render(<KudosCard {...baseProps} contentLines={5} showImages canEdit onEdit={onEdit} />);

    fireEvent.click(screen.getByLabelText("Sửa"));
    expect(onEdit).toHaveBeenCalledWith("kudos-1");
  });

  it("does NOT navigate when the content body is clicked (product decision: only 'Xem chi tiết' navigates)", () => {
    const onOpenDetail = vi.fn();
    render(<KudosCard {...baseProps} contentLines={3} showImages={false} onOpenDetail={onOpenDetail} />);

    fireEvent.click(screen.getByText("Cảm ơn bạn rất nhiều."));
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it("renders list/blockquote content with real markers (not bare browser defaults)", () => {
    const cardWithList: KudosCardData = {
      ...baseCard,
      content: "<ul><li>Một</li><li>Hai</li></ul><blockquote>Trích dẫn</blockquote>",
    };
    render(<KudosCard {...baseProps} card={cardWithList} contentLines={5} showImages />);

    // The list/blockquote styling is a `[&_ul]:...` descendant utility on the
    // WRAPPING content div (jsdom doesn't run Tailwind's JIT compiler, so
    // this only confirms the class string is present, not the computed
    // style) — the `<ul>`/`<blockquote>` themselves carry no class.
    const listWrapper = screen.getByText("Một").closest("ul")?.parentElement;
    expect(listWrapper?.className).toContain("[&_ul]:list-disc");
    expect(listWrapper?.className).toContain("[&_blockquote]:border-l-2");
  });

  it("does not force plain text to render bold (font-bold removed from the content wrapper)", () => {
    render(<KudosCard {...baseProps} contentLines={5} showImages />);
    const content = screen.getByText("Cảm ơn bạn rất nhiều.").closest("div");
    expect(content?.className).not.toContain("font-bold");
  });

  it("clamps content by default (Highlight/All Kudos)", () => {
    render(<KudosCard {...baseProps} contentLines={5} showImages />);
    const content = screen.getByText("Cảm ơn bạn rất nhiều.").closest("div");
    expect(content?.className).toContain("line-clamp-5");
  });

  it("does not clamp content when truncateContent is false (Detail page)", () => {
    render(<KudosCard {...baseProps} contentLines={5} showImages truncateContent={false} />);
    const content = screen.getByText("Cảm ơn bạn rất nhiều.").closest("div");
    expect(content?.className).not.toContain("line-clamp");
  });
});
