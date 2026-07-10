import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleLoginButton } from "./google-login-button";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const signInWithOAuth = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}));

describe("GoogleLoginButton", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
  });

  it("renders the translated button label", () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    render(<GoogleLoginButton />);

    expect(screen.getByRole("button", { name: "googleButton" })).toBeTruthy();
  });

  it("starts Google OAuth sign-in on click", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    render(<GoogleLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: "googleButton" }));

    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      }),
    );
  });

  it("shows no error message when sign-in succeeds", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    render(<GoogleLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: "googleButton" }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());
    expect(screen.queryByText(/.+/, { selector: "p" })).toBeNull();
  });

  it("shows the error message inline when sign-in fails", async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: "OAuth provider unavailable" } });
    render(<GoogleLoginButton />);

    fireEvent.click(screen.getByRole("button", { name: "googleButton" }));

    expect(await screen.findByText("OAuth provider unavailable")).toBeTruthy();
  });

  it("clears a previous error message on a new click attempt", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: { message: "OAuth provider unavailable" } });
    render(<GoogleLoginButton />);

    const button = screen.getByRole("button", { name: "googleButton" });
    fireEvent.click(button);
    expect(await screen.findByText("OAuth provider unavailable")).toBeTruthy();

    signInWithOAuth.mockResolvedValueOnce({ error: null });
    fireEvent.click(button);

    await waitFor(() => expect(screen.queryByText("OAuth provider unavailable")).toBeNull());
  });
});
