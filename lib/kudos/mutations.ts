import { createClient } from "@/lib/supabase/client";
import { isValidKudosImage, MAX_KUDOS_IMAGES } from "./validation";
import { mapKudosCard, type KudosCardRow } from "./queries-mappers";
import type { CreateKudosInput, KudosCard } from "./types";

export async function uploadKudosImages(files: File[]): Promise<string[]> {
  if (files.length > MAX_KUDOS_IMAGES) {
    throw new Error(`Maximum ${MAX_KUDOS_IMAGES} images allowed`);
  }
  for (const file of files) {
    if (!isValidKudosImage(file)) {
      throw new Error(`Invalid file: ${file.name} (type or size not allowed)`);
    }
  }

  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not authenticated");

  const paths: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("kudos-images").upload(path, file);
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function toggleKudosLike(kudosId: string): Promise<{ liked: boolean; heartCount: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("toggle_kudos_like", { p_kudos_id: kudosId });
  if (error) throw error;
  const row = data as { liked: boolean; heart_count: number };
  return { liked: row.liked, heartCount: row.heart_count };
}

export type UpdateKudosInput = {
  kudosId: string;
  title: string;
  content: string;
  hashtagIds: number[];
  /** Full desired final set (replace-all, same convention as `hashtagIds`) —
   *  pass every image path to KEEP plus every newly-uploaded path; anything
   *  omitted is deleted. */
  imagePaths: string[];
};

/** Only the original sender can edit (server-enforced, see `update_kudos` migration) — recipient/sender identity/anonymity are not editable. */
export async function updateKudos(input: UpdateKudosInput): Promise<KudosCard> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("update_kudos", {
    p_kudos_id: input.kudosId,
    p_title: input.title,
    p_content: input.content,
    p_hashtag_ids: input.hashtagIds,
    p_image_paths: input.imagePaths,
  });
  if (error) throw error;
  return mapKudosCard(data as KudosCardRow);
}

export async function createKudos(input: CreateKudosInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_kudos", {
    p_recipient_id: input.recipientId,
    p_title: input.title,
    p_content: input.content,
    p_is_anonymous: input.isAnonymous,
    p_anonymous_display_name: input.anonymousDisplayName,
    p_hashtag_ids: input.hashtagIds,
    p_image_paths: input.imagePaths,
    p_mentioned_profile_ids: input.mentionedProfileIds,
  });
  if (error) throw error;
  return data as string;
}
