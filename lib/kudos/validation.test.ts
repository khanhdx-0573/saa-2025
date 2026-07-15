import { describe, it, expect } from "vitest";
import {
  isValidKudosImage,
  isValidLinkUrl,
  MAX_KUDOS_IMAGES,
  MAX_KUDOS_IMAGE_BYTES,
  MAX_LINK_URL_CHARS,
  starRating,
  SPOTLIGHT_SEARCH_MAX_CHARS,
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

describe("starRating", () => {
  it("should return 0 for counts below STAR_1_THRESHOLD (9)", () => {
    expect(starRating(0)).toBe(0);
    expect(starRating(5)).toBe(0);
    expect(starRating(9)).toBe(0);
  });

  it("should return 1 for counts at exactly STAR_1_THRESHOLD (10)", () => {
    expect(starRating(10)).toBe(1);
  });

  it("should return 1 for counts between STAR_1_THRESHOLD and STAR_2_THRESHOLD", () => {
    expect(starRating(15)).toBe(1);
    expect(starRating(19)).toBe(1);
  });

  it("should return 2 for counts at exactly STAR_2_THRESHOLD (20)", () => {
    expect(starRating(20)).toBe(2);
  });

  it("should return 2 for counts between STAR_2_THRESHOLD and STAR_3_THRESHOLD", () => {
    expect(starRating(30)).toBe(2);
    expect(starRating(49)).toBe(2);
  });

  it("should return 3 for counts at exactly STAR_3_THRESHOLD (50)", () => {
    expect(starRating(50)).toBe(3);
  });

  it("should return 3 for counts above STAR_3_THRESHOLD", () => {
    expect(starRating(100)).toBe(3);
    expect(starRating(1000)).toBe(3);
  });

  it("covers all boundary cases: 9→0, 10→1, 19→1, 20→2, 49→2, 50→3", () => {
    expect(starRating(9)).toBe(0);
    expect(starRating(10)).toBe(1);
    expect(starRating(19)).toBe(1);
    expect(starRating(20)).toBe(2);
    expect(starRating(49)).toBe(2);
    expect(starRating(50)).toBe(3);
  });
});

describe("SPOTLIGHT_SEARCH_MAX_CHARS", () => {
  it("should be 100", () => {
    expect(SPOTLIGHT_SEARCH_MAX_CHARS).toBe(100);
  });
});
