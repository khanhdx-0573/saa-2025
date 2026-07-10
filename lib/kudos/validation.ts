export const MIN_HASHTAGS = 1;
export const MAX_HASHTAGS = 5;
export const MAX_KUDOS_IMAGES = 5;
export const MAX_KUDOS_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_KUDOS_TITLE_CHARS = 100;
export const MAX_KUDOS_CONTENT_CHARS = 1000;
export const MAX_LINK_TEXT_CHARS = 100;
export const MIN_LINK_URL_CHARS = 5;
export const MAX_LINK_URL_CHARS = 2048;

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
