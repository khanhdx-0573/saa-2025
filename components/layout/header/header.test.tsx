import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./header";

const mockUseAuth = vi.fn();
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher-stub" />,
}));

vi.mock("@/components/layout/header/profile-dropdown", () => ({
  ProfileDropdown: ({ userId }: { userId: string }) => (
    <div data-testid="profile-dropdown-stub" data-user-id={userId} />
  ),
}));

describe("Header", () => {
  describe("unauthenticated", () => {
    it("renders only the logo and language switcher, no nav/bell/avatar (FR-001)", () => {
      mockUseAuth.mockReturnValue({ user: null });
      mockUsePathname.mockReturnValue("/login");

      render(<Header />);

      expect(screen.getByAltText("Sun* Annual Awards")).toBeTruthy();
      expect(screen.getByTestId("language-switcher-stub")).toBeTruthy();
      expect(screen.queryByRole("link", { name: "navKudos" })).toBeNull();
      expect(screen.queryByRole("link", { name: "navAboutSaa" })).toBeNull();
      expect(screen.queryByRole("link", { name: "navAwardInfo" })).toBeNull();
      expect(screen.queryByTestId("header-bell")).toBeNull();
      expect(screen.queryByTestId("profile-dropdown-stub")).toBeNull();
    });
  });

  describe("authenticated", () => {
    it("renders all 3 nav tabs, bell, avatar (href to own profile) — Kudos active on /kudos", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-123", email: "sunner@example.com" } });
      mockUsePathname.mockReturnValue("/kudos");

      render(<Header />);

      const kudosLink = screen.getByRole("link", { name: "navKudos" });
      const aboutLink = screen.getByRole("link", { name: "navAboutSaa" });
      const awardLink = screen.getByRole("link", { name: "navAwardInfo" });

      expect(kudosLink.getAttribute("href")).toBe("/kudos");
      expect(aboutLink.getAttribute("href")).toBe("/about-saa-2025");
      expect(awardLink.getAttribute("href")).toBe("/award-information");

      expect(kudosLink.getAttribute("aria-current")).toBe("page");
      expect(aboutLink.getAttribute("aria-current")).toBeNull();
      expect(awardLink.getAttribute("aria-current")).toBeNull();

      const profileDropdown = screen.getByTestId("profile-dropdown-stub");
      expect(profileDropdown.getAttribute("data-user-id")).toBe("user-123");

      expect(screen.getByTestId("header-bell")).toBeTruthy();
      expect(screen.getByTestId("language-switcher-stub")).toBeTruthy();
    });

    it.each([
      ["/kudos", "navKudos"],
      ["/kudos/abc-123", "navKudos"],
      ["/about-saa-2025", "navAboutSaa"],
      ["/award-information", "navAwardInfo"],
    ])("marks %s active for %s and leaves the other two inactive", (pathname, activeKey) => {
      mockUseAuth.mockReturnValue({ user: { id: "user-123", email: null } });
      mockUsePathname.mockReturnValue(pathname);

      render(<Header />);

      const allKeys = ["navKudos", "navAboutSaa", "navAwardInfo"];
      for (const key of allKeys) {
        const link = screen.getByRole("link", { name: key });
        expect(link.getAttribute("aria-current")).toBe(key === activeKey ? "page" : null);
      }
    });

    it("leaves no tab active on /profile/[id] (edge case)", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-123", email: null } });
      mockUsePathname.mockReturnValue("/profile/user-123");

      render(<Header />);

      for (const key of ["navKudos", "navAboutSaa", "navAwardInfo"]) {
        expect(screen.getByRole("link", { name: key }).getAttribute("aria-current")).toBeNull();
      }
    });

    it("renders the bell as non-interactive — no button/link role, not in tab order (FR-006)", () => {
      mockUseAuth.mockReturnValue({ user: { id: "user-123", email: null } });
      mockUsePathname.mockReturnValue("/kudos");

      render(<Header />);

      const bell = screen.getByTestId("header-bell");
      expect(bell.tagName).toBe("SPAN");
      expect(bell.getAttribute("role")).toBeNull();
      expect(bell.hasAttribute("tabindex")).toBe(false);
      expect(bell.closest("button, a")).toBeNull();
      // Bell + its dot are aria-hidden — decorative only, not exposed to AT.
      expect(bell.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
