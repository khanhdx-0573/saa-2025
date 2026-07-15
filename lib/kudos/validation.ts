export const MIN_HASHTAGS = 1;
export const MAX_HASHTAGS = 5;
export const MAX_KUDOS_IMAGES = 5;
export const MAX_KUDOS_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_KUDOS_TITLE_CHARS = 100;
export const MAX_KUDOS_CONTENT_CHARS = 1000;
export const MAX_LINK_TEXT_CHARS = 100;
export const MIN_LINK_URL_CHARS = 5;
export const MAX_LINK_URL_CHARS = 2048;
export const STAR_1_THRESHOLD = 10;
export const STAR_2_THRESHOLD = 20;
export const STAR_3_THRESHOLD = 50;
export const SPOTLIGHT_SEARCH_MAX_CHARS = 100;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

export function isValidKudosImage(file: File): boolean {
  return ALLOWED_MIME_TYPES.has(file.type) && file.size <= MAX_KUDOS_IMAGE_BYTES;
}

/** Per Add-link spec (MoMorph OyDLDuSGEa, item C): http(s) URL, 5-2048 chars. */
export function isValidLinkUrl(value: string): boolean {
  if (value.length < MIN_LINK_URL_CHARS || value.length > MAX_LINK_URL_CHARS) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** BR-06: star rating tiers by lifetime received-kudos count. */
export function starRating(receivedCount: number): 0 | 1 | 2 | 3 {
  if (receivedCount >= STAR_3_THRESHOLD) return 3;
  if (receivedCount >= STAR_2_THRESHOLD) return 2;
  if (receivedCount >= STAR_1_THRESHOLD) return 1;
  return 0;
}
