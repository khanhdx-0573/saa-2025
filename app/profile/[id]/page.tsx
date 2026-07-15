import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { ProfilePageClient, type ProfileDetail } from "@/components/profile/profile-page-client";
import { createClient } from "@/lib/supabase/server";
import { starRating } from "@/lib/kudos/validation";
import type { Profile, KudosStats } from "@/lib/kudos/types";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Real `profiles` + `get_kudos_stats` binding (Phase 02 contract). Uses the
 * server-side Supabase client (`lib/supabase/server`, cookie-backed) rather
 * than `lib/kudos/getKudosStats` (which wraps the browser client from
 * `lib/supabase/client`) — this is an async Server
 * Component, and a browser-only client has no reliable session/cookie access
 * outside a browser context. Maps the snake_case `Profile` + stats into the
 * camelCase `ProfileDetail` shape `ProfilePageClient` actually renders.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, department")
    .eq("id", id)
    .limit(1)
    .returns<Profile[]>();
  if (profileError) throw profileError;
  const profileRow = profileRows?.[0];

  if (!profileRow) {
    notFound();
  }

  const { data: statsData, error: statsError } = await supabase.rpc("get_kudos_stats", { p_user_id: id });
  if (statsError) throw statsError;
  const stats = (statsData as KudosStats | null) ?? { received: 0, sent: 0, hearts: 0 };

  const t = await getTranslations("KudosLiveBoard");
  const profile: ProfileDetail = {
    id: profileRow.id,
    fullName: profileRow.full_name ?? t("card.unknownUser"),
    avatarUrl: profileRow.avatar_url,
    department: profileRow.department,
    starRating: starRating(stats.received),
    stats,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <ProfilePageClient profile={profile} />
      </main>
      <Footer />
    </div>
  );
}
