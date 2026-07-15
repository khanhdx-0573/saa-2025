// snake_case jsonb (Phase 01 RPC contract) -> camelCase TS mapping helpers.
// Kept separate from queries.ts to keep that file under the ~200-line guidance
// while preserving a single stable public import surface (re-exported types
// live in ./types; these row/mapper helpers are internal to lib/kudos).
import { createClient } from "@/lib/supabase/client";
import { starRating } from "./validation";
import type { Profile, Hashtag, KudosCard, SpotlightActivityItem, SpotlightData, SpotlightNode } from "./types";
import type { KudosCardData } from "@/components/kudos/feed/kudos-card";
import type { KudosCardPartyProfile } from "@/components/kudos/feed/kudos-card-party";

export type KudosCardRow = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  anonymous_display_name: string | null;
  sender: Profile | null;
  recipient: Profile;
  hashtags: Hashtag[];
  images: { id: number; storage_path: string; position: number }[];
  heart_count: number;
  liked_by_me: boolean;
  sender_received_count: number | null;
  recipient_received_count: number;
};

export type SpotlightNodeRow = {
  sender_id: string;
  full_name: string | null;
  avatar_url: string | null;
  sent_count: number;
  last_sent_at: string;
  last_kudos_id: string;
};

export type SpotlightActivityRow = {
  kudos_id: string;
  recipient_id: string;
  full_name: string | null;
  received_at: string;
};

export type SpotlightDataRow = {
  total_kudos: number;
  nodes: SpotlightNodeRow[];
  recent_activity: SpotlightActivityRow[];
};

export function mapKudosCard(row: KudosCardRow): KudosCard {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    isAnonymous: row.is_anonymous,
    anonymousDisplayName: row.anonymous_display_name,
    sender: row.sender,
    recipient: row.recipient,
    hashtags: row.hashtags,
    images: row.images.map((image) => ({ path: image.storage_path })),
    heartCount: row.heart_count,
    likedByMe: row.liked_by_me,
    senderReceivedCount: row.sender_received_count,
    recipientReceivedCount: row.recipient_received_count,
  };
}

function mapSpotlightNode(row: SpotlightNodeRow): SpotlightNode {
  return {
    senderId: row.sender_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    sentCount: row.sent_count,
    lastSentAt: row.last_sent_at,
    lastKudosId: row.last_kudos_id,
  };
}

function mapSpotlightActivity(row: SpotlightActivityRow): SpotlightActivityItem {
  return {
    kudosId: row.kudos_id,
    recipientId: row.recipient_id,
    fullName: row.full_name,
    receivedAt: row.received_at,
  };
}

export function mapSpotlightData(row: SpotlightDataRow): SpotlightData {
  return {
    totalKudos: row.total_kudos,
    nodes: row.nodes.map(mapSpotlightNode),
    recentActivity: row.recent_activity.map(mapSpotlightActivity),
  };
}

const KUDOS_IMAGES_BUCKET = "kudos-images";

/** Exported for `kudos-edit-modal.tsx` — it fetches `getKudosDetail`'s raw `{path}[]` and needs the same public-URL resolution `mapKudosCardToCardData` uses. */
export function resolveImagePublicUrl(path: string): string {
  const supabase = createClient();
  return supabase.storage.from(KUDOS_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

function toParty(profile: Profile, receivedCount: number, unknownUserLabel: string): KudosCardPartyProfile {
  return {
    id: profile.id,
    fullName: profile.full_name ?? unknownUserLabel,
    avatarUrl: profile.avatar_url,
    department: profile.department,
    starRating: starRating(receivedCount),
  };
}

export type MapKudosCardOptions = {
  /** Shown when a party's `full_name` is `null` (Profile allows it). */
  unknownUserLabel: string;
};

/**
 * Integration's single reconciliation point between the Phase 02 `KudosCard`
 * (RPC-mapped, lib-owned, snake_case source) and the Phase 04 `KudosCardData`
 * (presentational prop shape): resolves each image's public Supabase Storage
 * URL and computes each party's star rating (BR-06) from their lifetime
 * received-kudos count. Every container that renders a `KudosCard` component
 * from a `KudosCard` (lib) instance goes through this function — no ad-hoc
 * inline mapping.
 *
 * Deliberately does NOT compute `detailUrl` or `heartDisabled` here: both are
 * per-viewer/per-render-context values (window origin, current user id), see
 * `buildKudosDetailUrl` / `isSelfKudos` below.
 */
export function mapKudosCardToCardData(card: KudosCard, options: MapKudosCardOptions): KudosCardData {
  return {
    id: card.id,
    sender: card.sender ? toParty(card.sender, card.senderReceivedCount ?? 0, options.unknownUserLabel) : null,
    isAnonymous: card.isAnonymous,
    anonymousDisplayName: card.anonymousDisplayName,
    recipient: toParty(card.recipient, card.recipientReceivedCount, options.unknownUserLabel),
    title: card.title,
    content: card.content,
    createdAt: card.createdAt,
    hashtags: card.hashtags.map((hashtag) => hashtag.name),
    images: card.images.map((image) => ({ path: image.path, url: resolveImagePublicUrl(image.path) })),
    heartCount: card.heartCount,
    likedByMe: card.likedByMe,
  };
}

/** `{origin}/kudos/{id}` (FR-010), SSR-safe (falls back to a relative path). */
export function buildKudosDetailUrl(kudosId: string): string {
  return typeof window !== "undefined" ? `${window.location.origin}/kudos/${kudosId}` : `/kudos/${kudosId}`;
}

/** BR-04: a user can't like their own Kudos — UX-only, the RPC re-enforces it server-side. */
export function isSelfKudos(card: Pick<KudosCard, "sender">, currentUserId: string | null): boolean {
  return currentUserId !== null && card.sender?.id === currentUserId;
}
