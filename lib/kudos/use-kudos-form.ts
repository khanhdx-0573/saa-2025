"use client";

import { useCallback, useState } from "react";
import type { CreateKudosInput, Profile } from "./types";
import { MIN_HASHTAGS, MAX_HASHTAGS } from "./validation";

export type KudosFormState = {
  recipient: Profile | null;
  setRecipient: (profile: Profile | null) => void;
  title: string;
  setTitle: (value: string) => void;
  content: string;
  isContentEmpty: boolean;
  setContent: (html: string, isEmpty: boolean) => void;
  hashtagIds: number[];
  setHashtagIds: (updater: number[] | ((prev: number[]) => number[])) => void;
  images: File[];
  setImages: (updater: File[] | ((prev: File[]) => File[])) => void;
  isAnonymous: boolean;
  setIsAnonymous: (value: boolean) => void;
  anonymousName: string;
  setAnonymousName: (value: string) => void;
  canSubmit: boolean;
  reset: () => void;
  toCreateKudosInput: (imagePaths: string[], mentionedProfileIds: string[]) => CreateKudosInput;
};

/**
 * Single source of truth for the "Viết Kudo" compose form. `canSubmit` is the
 * one derived boolean the modal/footer read — no scattered validation checks
 * elsewhere (per phase-04 Key Insights).
 *
 * Emptiness of `content` is tracked separately from the HTML string itself:
 * Tiptap's empty document still serializes to a non-empty string like
 * `<p></p>`, so a naive `content.trim().length > 0` check would never block
 * submit. The editor reports `editor.isEmpty` alongside the HTML via
 * `setContent`.
 */
export function useKudosForm(): KudosFormState {
  const [recipient, setRecipient] = useState<Profile | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContentRaw] = useState("");
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [hashtagIds, setHashtagIds] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousName, setAnonymousName] = useState("");

  const setContent = useCallback((html: string, isEmpty: boolean) => {
    setContentRaw(html);
    setIsContentEmpty(isEmpty);
  }, []);

  const reset = useCallback(() => {
    setRecipient(null);
    setTitle("");
    setContentRaw("");
    setIsContentEmpty(true);
    setHashtagIds([]);
    setImages([]);
    setIsAnonymous(false);
    setAnonymousName("");
  }, []);

  const toCreateKudosInput = useCallback(
    (imagePaths: string[], mentionedProfileIds: string[]): CreateKudosInput => ({
      recipientId: recipient?.id ?? "",
      title: title.trim(),
      content,
      isAnonymous,
      anonymousDisplayName: isAnonymous ? anonymousName : null,
      hashtagIds,
      imagePaths,
      mentionedProfileIds,
    }),
    [recipient, title, content, isAnonymous, anonymousName, hashtagIds]
  );

  const canSubmit =
    recipient !== null &&
    title.trim().length > 0 &&
    !isContentEmpty &&
    hashtagIds.length >= MIN_HASHTAGS &&
    hashtagIds.length <= MAX_HASHTAGS &&
    (!isAnonymous || anonymousName.trim().length > 0);

  return {
    recipient,
    setRecipient,
    title,
    setTitle,
    content,
    isContentEmpty,
    setContent,
    hashtagIds,
    setHashtagIds,
    images,
    setImages,
    isAnonymous,
    setIsAnonymous,
    anonymousName,
    setAnonymousName,
    canSubmit,
    reset,
    toCreateKudosInput,
  };
}
