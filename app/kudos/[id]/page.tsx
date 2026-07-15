import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { KudosDetailPageClient } from "@/components/kudos/board/kudos-detail-page-client";
import { createClient } from "@/lib/supabase/server";
import { mapKudosCard, type KudosCardRow } from "@/lib/kudos/queries-mappers";

type KudosDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Real `get_kudos_detail` binding (Phase 02 RPC contract). Uses the
 * server-side Supabase client (`lib/supabase/server`, cookie-backed) rather
 * than `lib/kudos/getKudosDetail` (which wraps the browser client from
 * `lib/supabase/client`) — this is an async Server Component, and a
 * browser-only client has no reliable session/cookie access outside a
 * browser context. Reuses the same `mapKudosCard` row mapper so the shape
 * handed to the client stays identical either way.
 */
export default async function KudosDetailPage({ params }: KudosDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_kudos_detail", { p_kudos_id: id });
  if (error) {
    // fix-bug: `p_kudos_id` is a `uuid` column — a non-UUID `id` (e.g. the
    // Spotlight board's mock `lastKudosId` placeholders) fails at Postgres's
    // parameter-binding stage with 22P02 ("invalid_text_representation")
    // BEFORE `get_kudos_detail` ever runs, so it never reaches the RPC's own
    // "null when the id does not exist" contract. Same user-facing outcome
    // either way — this id doesn't resolve to a real kudos — so treat it as
    // 404 rather than crashing the page on any other, genuinely unexpected
    // database error.
    if (error.code === "22P02") notFound();
    throw error;
  }

  if (!data) {
    notFound();
  }

  const card = mapKudosCard(data as KudosCardRow);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <KudosDetailPageClient card={card} />
      </main>
      <Footer />
    </div>
  );
}
