import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKudosForm } from "./use-kudos-form";
import type { Profile } from "./types";

const mockProfile: Profile = {
  id: "user-123",
  full_name: "John Doe",
  avatar_url: null,
  department: "CEV1",
};

describe("useKudosForm", () => {
  describe("canSubmit derivation", () => {
    it("should be false initially (no recipient, no content, no hashtags)", () => {
      const { result } = renderHook(() => useKudosForm());
      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false with recipient but no content", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false with recipient and content but no hashtags", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setContent("<p>Thank you!</p>", false);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false with recipient, content, and 0 hashtags", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([]);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be true with recipient, content, and 1 hashtag (minimum)", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should be true with recipient, content, and 2 hashtags", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1, 2]);
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should be true with recipient, content, and 5 hashtags (maximum)", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1, 2, 3, 4, 5]);
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should be false with recipient, content, hashtag, but no title (missing 'Danh hiệu')", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false with a whitespace-only title", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("   ");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false when anonymous is on but the nickname is empty", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
        result.current.setIsAnonymous(true);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false when anonymous is on but the nickname is whitespace-only", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
        result.current.setIsAnonymous(true);
        result.current.setAnonymousName("   ");
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be true when anonymous is on and the nickname is filled", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
        result.current.setIsAnonymous(true);
        result.current.setAnonymousName("Doraemon");
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should be false with recipient, content, and 6 hashtags (over maximum)", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1, 2, 3, 4, 5, 6]);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false with empty content (isContentEmpty=true)", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setContent("<p></p>", true); // isContentEmpty = true
        result.current.setHashtagIds([1]);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should be false without recipient (recipient=null)", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should transition from false to true as requirements are met", () => {
      const { result } = renderHook(() => useKudosForm());

      expect(result.current.canSubmit).toBe(false);

      act(() => {
        result.current.setRecipient(mockProfile);
      });
      expect(result.current.canSubmit).toBe(false);

      act(() => {
        result.current.setContent("<p>Thank you!</p>", false);
      });
      expect(result.current.canSubmit).toBe(false);

      act(() => {
        result.current.setTitle("Great teammate");
      });
      expect(result.current.canSubmit).toBe(false);

      act(() => {
        result.current.setHashtagIds([1]);
      });
      expect(result.current.canSubmit).toBe(true);
    });

    it("should transition from true to false if requirements are removed", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });
      expect(result.current.canSubmit).toBe(true);

      act(() => {
        result.current.setHashtagIds([]);
      });
      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe("reset", () => {
    it("should clear recipient and make canSubmit false", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });
      expect(result.current.canSubmit).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.recipient).toBe(null);
      expect(result.current.canSubmit).toBe(false);
    });

    it("should clear content and make canSubmit false", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1]);
      });
      expect(result.current.canSubmit).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.content).toBe("");
      expect(result.current.isContentEmpty).toBe(true);
      expect(result.current.canSubmit).toBe(false);
    });

    it("should clear hashtags and make canSubmit false", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1, 2, 3]);
      });
      expect(result.current.canSubmit).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.hashtagIds).toEqual([]);
      expect(result.current.canSubmit).toBe(false);
    });

    it("should reset all form state to initial values", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setRecipient(mockProfile);
        result.current.setTitle("Great teammate");
        result.current.setContent("<p>Thank you!</p>", false);
        result.current.setHashtagIds([1, 2]);
        result.current.setImages([new File([], "test.jpg")]);
        result.current.setIsAnonymous(true);
        result.current.setAnonymousName("Anonymous User");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.recipient).toBe(null);
      expect(result.current.title).toBe("");
      expect(result.current.content).toBe("");
      expect(result.current.isContentEmpty).toBe(true);
      expect(result.current.hashtagIds).toEqual([]);
      expect(result.current.images).toEqual([]);
      expect(result.current.isAnonymous).toBe(false);
      expect(result.current.anonymousName).toBe("");
      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe("setContent", () => {
    it("should update both content HTML and isEmpty flag", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setContent("<p>Thank you!</p>", false);
      });

      expect(result.current.content).toBe("<p>Thank you!</p>");
      expect(result.current.isContentEmpty).toBe(false);
    });

    it("should track empty state separately from HTML content", () => {
      const { result } = renderHook(() => useKudosForm());

      act(() => {
        result.current.setContent("<p></p>", true);
      });

      expect(result.current.content).toBe("<p></p>");
      expect(result.current.isContentEmpty).toBe(true);
    });
  });
});
