import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilePageClient, type ProfileDetail } from "./profile-page-client";

const mockUseAuth = vi.fn();
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const baseProfile: ProfileDetail = {
  id: "sunner-1",
  fullName: "Nguyễn Văn An",
  avatarUrl: null,
  department: "Web Division",
  starRating: 2,
  stats: { received: 24, sent: 18, hearts: 57 },
};

describe("ProfilePageClient", () => {
  it("renders the Sunner's name, department, and kudos stats", () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<ProfilePageClient profile={baseProfile} />);

    expect(screen.getByRole("heading", { name: "Nguyễn Văn An" })).toBeTruthy();
    expect(screen.getByText("Web Division")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
    expect(screen.getByText("18")).toBeTruthy();
    expect(screen.getByText("57")).toBeTruthy();
  });

  it("falls back to initials when there is no avatar", () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<ProfilePageClient profile={baseProfile} />);

    expect(screen.getByText("VA")).toBeTruthy();
  });

  it("renders the real StarBadge matching starRating out of 3", () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<ProfilePageClient profile={baseProfile} />);

    // StarBadge (Phase 04) shows a threshold tooltip keyed by the star count —
    // "star.threshold2" for starRating=2 confirms the real shared component
    // rendered (not the old inline mock placeholder).
    expect(screen.getByText("star.threshold2")).toBeTruthy();
  });

  it("renders no StarBadge when starRating is 0", () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<ProfilePageClient profile={{ ...baseProfile, starRating: 0 }} />);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("flags the profile as the signed-in Sunner via useAuth", () => {
    mockUseAuth.mockReturnValue({ user: { id: "sunner-1", email: null } });
    render(<ProfilePageClient profile={baseProfile} />);

    expect(screen.getByText("profile.currentUserBadge")).toBeTruthy();
  });

  it("does not flag the profile when the viewer is someone else", () => {
    mockUseAuth.mockReturnValue({ user: { id: "someone-else", email: null } });
    render(<ProfilePageClient profile={baseProfile} />);

    expect(screen.queryByText("profile.currentUserBadge")).toBeNull();
  });
});
