/**
 * Sanitizes Tiptap-authored kudos content HTML before it's ever rendered via
 * `dangerouslySetInnerHTML` (fix-bug: raw `<p>...</p>` was showing up as
 * literal text because the stored HTML was being escaped as plain text
 * instead of rendered). Allowlist matches exactly what `kudos-editor.tsx`'s
 * Tiptap schema can produce (StarterKit + Link + Mention) — anything else is
 * dropped, since `kudos.content` is a plain `text` column with no server-side
 * HTML validation and could in principle be written directly via the RPC,
 * not just through this editor.
 *
 * Callers render this through a client component, but Next.js still runs
 * that component's render (and this function) during SSR to produce the
 * initial HTML — where `DOMParser`/`document` don't exist (fix-bug: SSR
 * crashed with `ReferenceError: DOMParser is not defined`). When no DOM is
 * available, this degrades to an escaped, tag-stripped plain-text rendering
 * instead of throwing; the client re-runs this same function during
 * hydration (DOMParser exists there) and swaps in the fully formatted HTML.
 */

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "S",
  "STRIKE",
  "DEL",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "CODE",
  "PRE",
  "A",
  "SPAN",
]);

function isSafeUrl(href: string): boolean {
  try {
    const url = new URL(href, "http://localhost");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeNode(node: Node, out: Node[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(node.cloneNode());
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  if (!ALLOWED_TAGS.has(el.tagName)) {
    // Unwrap disallowed elements: keep their sanitized children, drop the tag itself.
    el.childNodes.forEach((child) => sanitizeNode(child, out));
    return;
  }

  const clean = document.createElement(el.tagName);
  if (el.tagName === "A") {
    const href = el.getAttribute("href") ?? "";
    if (isSafeUrl(href)) {
      clean.setAttribute("href", href);
      clean.setAttribute("target", "_blank");
      clean.setAttribute("rel", "noopener noreferrer");
    }
  }
  if (el.tagName === "SPAN" && el.classList.contains("kudos-mention")) {
    clean.setAttribute("class", "kudos-mention");
  }

  const childOut: Node[] = [];
  el.childNodes.forEach((child) => sanitizeNode(child, childOut));
  childOut.forEach((child) => clean.appendChild(child));
  out.push(clean);
}

/** No-DOM (SSR) fallback: strip tags, then escape anything left so the result is always safe as raw HTML. */
function toEscapedPlainTextFallback(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Returns sanitized HTML safe to pass to `dangerouslySetInnerHTML`. Falls back to escaped plain text when no DOM is available (SSR). */
export function sanitizeKudosContentHtml(html: string): string {
  if (typeof document === "undefined" || typeof DOMParser === "undefined") {
    return toEscapedPlainTextFallback(html);
  }
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const container = document.createElement("div");
  const out: Node[] = [];
  parsed.body.childNodes.forEach((child) => sanitizeNode(child, out));
  out.forEach((node) => container.appendChild(node));
  return container.innerHTML;
}
