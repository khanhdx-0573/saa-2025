import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileDropdown } from "./profile-dropdown";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const signOut = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut } }),
}));

describe("ProfileDropdown", () => {
  beforeEach(() => {
    push.mockReset();
    signOut.mockReset();
    signOut.mockResolvedValue({ error: null });
  });

  it("renders only the closed avatar trigger by default", () => {
    render(<ProfileDropdown userId="user-123" />);

    expect(screen.getByRole("button", { name: "avatarAriaLabel" })).toBeTruthy();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the menu on trigger click, showing Profile and Logout items", () => {
    render(<ProfileDropdown userId="user-123" />);

    fireEvent.click(screen.getByRole("button", { name: "avatarAriaLabel" }));

    expect(screen.getByRole("menu")).toBeTruthy();
    const profileLink = screen.getByRole("menuitem", { name: "profile" });
    expect(profileLink.getAttribute("href")).toBe("/profile/user-123");
    expect(screen.getByRole("menuitem", { name: "logout" })).toBeTruthy();
  });

  it("closes the menu when the trigger is clicked again", () => {
    render(<ProfileDropdown userId="user-123" />);

    const trigger = screen.getByRole("button", { name: "avatarAriaLabel" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes the menu on outside click", () => {
    render(
      <div>
        <div data-testid="outside" />
        <ProfileDropdown userId="user-123" />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "avatarAriaLabel" }));
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes the menu when the Profile link is clicked", () => {
    render(<ProfileDropdown userId="user-123" />);

    fireEvent.click(screen.getByRole("button", { name: "avatarAriaLabel" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "profile" }));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("signs out and redirects to /login on Logout click", async () => {
    render(<ProfileDropdown userId="user-123" />);

    fireEvent.click(screen.getByRole("button", { name: "avatarAriaLabel" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "logout" }));

    expect(screen.queryByRole("menu")).toBeNull();
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith("/login");
  });
});
