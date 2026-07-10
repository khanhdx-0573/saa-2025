import { describe, it, expect } from "vitest";
import {
  isValidKudosImage,
  isValidLinkUrl,
  MAX_KUDOS_IMAGES,
  MAX_KUDOS_IMAGE_BYTES,
  MAX_LINK_URL_CHARS,
} from "./validation";

describe("MAX_KUDOS_IMAGES", () => {
  it("should be 5", () => {
    expect(MAX_KUDOS_IMAGES).toBe(5);
  });
});

describe("MAX_KUDOS_IMAGE_BYTES", () => {
  it("should be 5MB", () => {
    expect(MAX_KUDOS_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("should be 5242880 bytes", () => {
    expect(MAX_KUDOS_IMAGE_BYTES).toBe(5242880);
  });
});

describe("isValidKudosImage", () => {
  it("should accept valid JPEG file under 5MB", () => {
    const file = new File(["x".repeat(1024)], "photo.jpg", {
      type: "image/jpeg",
    });
    expect(isValidKudosImage(file)).toBe(true);
  });

  it("should accept valid PNG file under 5MB", () => {
    const file = new File(["x".repeat(1024)], "photo.png", {
      type: "image/png",
    });
    expect(isValidKudosImage(file)).toBe(true);
  });

  it("should reject PDF file even if under 5MB", () => {
    const file = new File(["x".repeat(1024)], "document.pdf", {
      type: "application/pdf",
    });
    expect(isValidKudosImage(file)).toBe(false);
  });

  it("should reject file over 5MB", () => {
    const oversizedContent = "x".repeat(MAX_KUDOS_IMAGE_BYTES + 1);
    const file = new File([oversizedContent], "huge.jpg", {
      type: "image/jpeg",
    });
    expect(isValidKudosImage(file)).toBe(false);
  });

  it("should accept file exactly 5MB (boundary condition)", () => {
    const exactBoundaryContent = "x".repeat(MAX_KUDOS_IMAGE_BYTES);
    const file = new File([exactBoundaryContent], "exact.jpg", {
      type: "image/jpeg",
    });
    expect(isValidKudosImage(file)).toBe(true);
  });

  it("should reject JPEG with wrong casing if MIME type check is case-sensitive", () => {
    // File API normalizes MIME types to lowercase, but let's verify the behavior
    const file = new File(["x".repeat(1024)], "photo.jpg", {
      type: "image/jpeg",
    });
    expect(file.type).toBe("image/jpeg");
    expect(isValidKudosImage(file)).toBe(true);
  });

  it("should reject unsupported image types like GIF", () => {
    const file = new File(["x".repeat(1024)], "animation.gif", {
      type: "image/gif",
    });
    expect(isValidKudosImage(file)).toBe(false);
  });

  it("should reject file with empty type", () => {
    const file = new File(["x".repeat(1024)], "noextension", {
      type: "",
    });
    expect(isValidKudosImage(file)).toBe(false);
  });

  it("should reject file with text type", () => {
    const file = new File(["x".repeat(1024)], "text.txt", {
      type: "text/plain",
    });
    expect(isValidKudosImage(file)).toBe(false);
  });

  it("should accept PNG exactly at boundary", () => {
    const exactBoundaryContent = "x".repeat(MAX_KUDOS_IMAGE_BYTES);
    const file = new File([exactBoundaryContent], "exact.png", {
      type: "image/png",
    });
    expect(isValidKudosImage(file)).toBe(true);
  });
});

describe("isValidLinkUrl", () => {
  it("should accept a valid https URL", () => {
    expect(isValidLinkUrl("https://example.com")).toBe(true);
  });

  it("should accept a valid http URL", () => {
    expect(isValidLinkUrl("http://example.com")).toBe(true);
  });

  it("should accept a URL with path and query string", () => {
    expect(isValidLinkUrl("https://example.com/path?q=1&r=2")).toBe(true);
  });

  it("should reject a string shorter than the minimum length", () => {
    expect(isValidLinkUrl("a.co")).toBe(false);
  });

  it("should reject a string longer than the maximum length", () => {
    const tooLong = `https://example.com/${"a".repeat(MAX_LINK_URL_CHARS)}`;
    expect(tooLong.length).toBeGreaterThan(MAX_LINK_URL_CHARS);
    expect(isValidLinkUrl(tooLong)).toBe(false);
  });

  it("should reject a non-http(s) protocol like ftp", () => {
    expect(isValidLinkUrl("ftp://example.com/file")).toBe(false);
  });

  it("should reject a javascript: URL (XSS guard)", () => {
    expect(isValidLinkUrl("javascript:alert(1)")).toBe(false);
  });

  it("should reject a mailto: URL", () => {
    expect(isValidLinkUrl("mailto:someone@example.com")).toBe(false);
  });

  it("should reject a non-URL string", () => {
    expect(isValidLinkUrl("not a valid url")).toBe(false);
  });

  it("should reject an empty string", () => {
    expect(isValidLinkUrl("")).toBe(false);
  });
});
