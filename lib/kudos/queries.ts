import { createClient } from "@/lib/supabase/client";
import type { Profile, Hashtag, KudosCard, KudosFilters, KudosStats, SpotlightData } from "./types";
import { mapKudosCard, mapSpotlightData, type KudosCardRow, type SpotlightDataRow } from "./queries-mappers";

export async function searchProfiles(query: string, excludeUserId?: string): Promise<Profile[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const supabase = createClient();
  let request = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, department")
    .ilike("full_name", `%${trimmed}%`)
    .limit(10);
  if (excludeUserId) request = request.neq("id", excludeUserId);
  const { data, error } = await request.returns<Profile[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listHashtags(): Promise<Hashtag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hashtags")
    .select("id, name")
    .order("name")
    .returns<Hashtag[]>();
  if (error) throw error;
  return data ?? [];
}

export async function listHighlightKudos(filters: KudosFilters): Promise<KudosCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_highlight_kudos", {
    p_hashtag_id: filters.hashtagId,
    p_department: filters.department,
  });
  if (error) throw error;
  const rows = (data ?? []) as KudosCardRow[];
  return rows.map(mapKudosCard);
}

/** `senderId` scopes the feed to only that sender's own kudos (product
 *  decision: the All Kudos section only shows — and only ever needs to show
 *  — kudos the viewer can edit). `null`/omitted keeps the company-wide feed. */
export async function listAllKudos(
  filters: KudosFilters,
  limit: number,
  offset: number,
  senderId: string | null = null
): Promise<KudosCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_kudos_feed", {
    p_hashtag_id: filters.hashtagId,
    p_department: filters.department,
    p_limit: limit,
    p_offset: offset,
    p_sender_id: senderId,
  });
  if (error) throw error;
  const rows = (data ?? []) as KudosCardRow[];
  return rows.map(mapKudosCard);
}

export async function getSpotlightData(filters: KudosFilters): Promise<SpotlightData> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_spotlight_nodes", {
    p_hashtag_id: filters.hashtagId,
    p_department: filters.department,
  });
  if (error) throw error;
  const row = data as SpotlightDataRow;
  return mapSpotlightData(row);
}

export async function getKudosDetail(id: string): Promise<KudosCard | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_kudos_detail", { p_kudos_id: id });
  if (error) throw error;
  if (!data) return null;
  return mapKudosCard(data as KudosCardRow);
}

export async function getKudosStats(userId: string): Promise<KudosStats> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_kudos_stats", { p_user_id: userId });
  if (error) throw error;
  return data as KudosStats;
}

export async function listDepartments(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("department")
    .returns<{ department: string }[]>();
  if (error) throw error;
  const departments = new Set((data ?? []).map((row) => row.department));
  return Array.from(departments).sort();
}
