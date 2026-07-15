import { describe, it, expect, vi, beforeEach } from "vitest";

const { rpc, notFound } = vi.hoisted(() => ({
  rpc: vi.fn(),
  // Mirrors next/navigation's real behavior closely enough for this test:
  // notFound() never returns, it always throws.
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));
vi.mock("next/navigation", () => ({ notFound }));

import KudosDetailPage from "./page";

describe("KudosDetailPage", () => {
  beforeEach(() => {
    rpc.mockReset();
    notFound.mockClear();
  });

  it("fix-bug regression: treats a non-UUID id (22P02) as not-found instead of crashing", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });

    await expect(KudosDetailPage({ params: Promise.resolve({ id: "mock-k2" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledOnce();
  });

  it("still throws on a genuine database error instead of masking it as not-found", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "08006", message: "connection failure" } });

    await expect(KudosDetailPage({ params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) })).rejects.toMatchObject(
      { code: "08006" }
    );

    expect(notFound).not.toHaveBeenCalled();
  });

  it("calls not-found when the RPC resolves with no data (real UUID, no matching row)", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      KudosDetailPage({ params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledOnce();
  });
});
