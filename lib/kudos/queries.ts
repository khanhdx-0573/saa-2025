import { createClient } from "@/lib/supabase/client";
import type { Profile, Hashtag } from "./types";

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
