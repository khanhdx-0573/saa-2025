import { describe, it, expect, afterEach, vi } from "vitest";
import { sanitizeKudosContentHtml } from "./sanitize-content-html";

describe("sanitizeKudosContentHtml", () => {
  it("preserves allowed tags from the Tiptap schema", () => {
    const html = "<p>Hello <strong>bold</strong> and <em>italic</em> world</p>";
    expect(sanitizeKudosContentHtml(html)).toBe(html);
  });

  it("preserves a safe http(s) link with target/rel hardening", () => {
    const html = '<p>See <a href="https://example.com">this</a></p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("preserves a protocol-relative link (legitimate external-link feature)", () => {
    const html = '<p><a href="//example.com">link</a></p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).toContain("href=\"//example.com\"");
  });

  it("preserves a mention span with only the allowlisted class", () => {
    const html = '<p>Hi <span class="kudos-mention" data-id="123" onclick="evil()">@user</span></p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).toContain('class="kudos-mention"');
    expect(out).not.toContain("data-id");
    expect(out).not.toContain("onclick");
    expect(out).toContain("@user");
  });

  it("strips <script> tags but preserves surrounding text (unwrap, not silent drop)", () => {
    const html = "<p>before<script>alert(1)</script>after</p>";
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("<script");
    expect(out).toContain("before");
    expect(out).toContain("after");
  });

  it("drops onerror/onclick/style event-handler and style attributes on allowed tags", () => {
    const html = '<p onclick="evil()" style="color:red" onerror="evil()">text</p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("style");
    expect(out).toContain("text");
  });

  it("rejects a javascript: URL on a link", () => {
    const html = '<p><a href="javascript:alert(1)">click</a></p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("href=");
    expect(out).toContain("click");
  });

  it("rejects a tab-obfuscated javascript: URL", () => {
    const html = '<p><a href="java\tscript:alert(1)">click</a></p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("href=");
  });

  it("rejects a data: URL on a link", () => {
    const html = '<p><a href="data:text/html,<script>alert(1)</script>">click</a></p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("href=");
  });

  it("unwraps a foreign <img onerror> (no allowed img tag in the schema)", () => {
    const html = '<p>before<img src="x" onerror="alert(1)">after</p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("<img");
    expect(out).not.toContain("onerror");
  });

  it("unwraps an unrecognized/unsafe element like <svg onload> while keeping its text", () => {
    const html = '<p>before<svg onload="alert(1)"><title>hi</title></svg>after</p>';
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("<svg");
    expect(out).not.toContain("onload");
    expect(out).toContain("before");
    expect(out).toContain("after");
  });

  it("unwraps disallowed structural tags (e.g. heading, hr) while preserving text", () => {
    const html = "<h1>Title</h1><p>body</p><hr>";
    const out = sanitizeKudosContentHtml(html);
    expect(out).not.toContain("<h1");
    expect(out).not.toContain("<hr");
    expect(out).toContain("Title");
    expect(out).toContain("body");
  });

  describe("SSR fallback (no DOMParser/document, e.g. Node during Next.js SSR)", () => {
    const originalDOMParser = globalThis.DOMParser;
    const originalDocument = globalThis.document;

    afterEach(() => {
      globalThis.DOMParser = originalDOMParser;
      globalThis.document = originalDocument;
      vi.unstubAllGlobals();
    });

    it("degrades to escaped plain text instead of throwing when DOMParser is undefined", () => {
      vi.stubGlobal("DOMParser", undefined);
      const html = "<p>Hello <strong>bold</strong> world</p>";
      expect(() => sanitizeKudosContentHtml(html)).not.toThrow();
      const out = sanitizeKudosContentHtml(html);
      expect(out).not.toContain("<p>");
      expect(out).not.toContain("<strong>");
      expect(out).toContain("Hello");
      expect(out).toContain("bold");
      expect(out).toContain("world");
    });

    it("escapes a raw <script> payload rather than passing it through unsanitized", () => {
      vi.stubGlobal("DOMParser", undefined);
      const html = '<p onclick="evil()">before<script>alert(1)</script>after</p>';
      const out = sanitizeKudosContentHtml(html);
      expect(out).not.toContain("<script");
      expect(out).not.toContain("<p ");
      expect(out).toContain("before");
      expect(out).toContain("after");
    });
  });
});
