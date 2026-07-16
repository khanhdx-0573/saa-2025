"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HashtagField } from "@/components/kudos/compose/hashtag-field";
import { CloseIcon, SendIcon } from "@/components/kudos/kudos-icons";
import { KudosEditor } from "@/components/kudos/compose/kudos-editor";
import { KudosEditImageField, type ExistingKudosImage } from "@/components/kudos/compose/kudos-edit-image-field";
import { TitleField } from "@/components/kudos/compose/title-field";
import { getKudosDetail, listHashtags } from "@/lib/kudos/queries";
import { resolveImagePublicUrl } from "@/lib/kudos/queries-mappers";
import { updateKudos, uploadKudosImages } from "@/lib/kudos/mutations";
import { MAX_HASHTAGS, MIN_HASHTAGS } from "@/lib/kudos/validation";
import type { Hashtag, KudosCard } from "@/lib/kudos/types";

type KudosEditModalProps = {
  /** `null` = closed. Passing an id opens the dialog and fetches that kudos. */
  kudosId: string | null;
  onClose: () => void;
  /** Lets the caller patch its own list/card state with the saved result
   *  instead of refetching the whole feed. */
  onSaved: (updated: KudosCard) => void;
};

/**
 * Edit pencil's target (Kudos Card, C.3/undocumented spec gap) — sender-only,
 * title/content/hashtags/images editable; recipient/sender identity/anonymity
 * stay as originally sent. Native `<dialog>` shell mirrors `kudos-modal.tsx`'s
 * own conventions (focus-trap + ESC-to-close, one `close` listener resets
 * state).
 */
export function KudosEditModal({ kudosId, onClose, onSaved }: KudosEditModalProps) {
  const t = useTranslations("KudosEditModal");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeHandlerRef = useRef<() => void>(() => {});

  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [hashtagIds, setHashtagIds] = useState<number[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingKudosImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    closeHandlerRef.current = () => {
      setTitle("");
      setContent("");
      setIsContentEmpty(true);
      setHashtagIds([]);
      setExistingImages([]);
      setNewImageFiles([]);
      setLoadError(null);
      setSubmitError(null);
      setHasAttemptedSubmit(false);
      onClose();
    };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleNativeClose() {
      closeHandlerRef.current();
    }
    dialog.addEventListener("close", handleNativeClose);
    return () => dialog.removeEventListener("close", handleNativeClose);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (kudosId && !dialog.open) {
      dialog.showModal();
      setLoading(true);
      Promise.all([getKudosDetail(kudosId), listHashtags()])
        .then(([detail, hashtagList]) => {
          setHashtags(hashtagList);
          if (!detail) {
            setLoadError(t("loadError"));
            return;
          }
          setTitle(detail.title);
          setContent(detail.content);
          setIsContentEmpty(false);
          setHashtagIds(detail.hashtags.map((hashtag) => hashtag.id));
          setExistingImages(detail.images.map((image) => ({ path: image.path, url: resolveImagePublicUrl(image.path) })));
          setNewImageFiles([]);
        })
        .catch(() => setLoadError(t("loadError")))
        .finally(() => setLoading(false));
    } else if (!kudosId && dialog.open) {
      dialog.close();
    }
  }, [kudosId, t]);

  const canSubmit =
    title.trim().length > 0 &&
    !isContentEmpty &&
    hashtagIds.length >= MIN_HASHTAGS &&
    hashtagIds.length <= MAX_HASHTAGS;
  const validationMessage = hasAttemptedSubmit && !canSubmit ? t("validationError") : null;
  // `kudosId !== null` is load-bearing, not just "don't show a spinner": a
  // native `<dialog>` without `open` is only hidden visually (`display:
  // none`), its content stays in the DOM — so `TitleField`'s
  // `#kudos-title-input` would otherwise collide with the compose modal's
  // (or any other open dialog's) even while this one is closed.
  const ready = kudosId !== null && !loading && !loadError;

  async function handleSubmit() {
    if (!kudosId || !canSubmit) {
      setHasAttemptedSubmit(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const uploadedPaths = newImageFiles.length > 0 ? await uploadKudosImages(newImageFiles) : [];
      const imagePaths = [...existingImages.map((image) => image.path), ...uploadedPaths];
      const updated = await updateKudos({ kudosId, title, content, hashtagIds, imagePaths });
      onSaved(updated);
      dialogRef.current?.close();
      toast.success(t("saveSuccess"));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("submitErrorFallback"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="h-screen max-h-screen w-screen max-w-screen overflow-y-auto bg-transparent p-0 backdrop:bg-details-header-overlay"
    >
      {/* fix-bug: `py-2.5` (10px) guarantees breathing room top/bottom even
         when the form (title+editor+hashtag+image, now that images are
         editable too) is taller than the viewport — `m-auto` alone collapses
         to a flush 0px gap once there's no leftover space left to center
         into, which read as the modal "overflowing" the screen edges. */}
      <div className="flex min-h-full py-2.5 px-3 sm:px-0">
        {/* fix-bug: shrunk to match `kudos-modal.tsx`'s shell (same
           overflow complaint applies to both). */}
        <div className="m-auto flex w-[680px] max-w-full flex-col gap-4 rounded-2xl bg-details-modal-background p-4 sm:gap-5 sm:rounded-3xl sm:p-7">
          <h2 className="text-center font-montserrat text-xl font-bold text-details-text-primary-2 sm:text-[26px]">{t("title")}</h2>

          {loading && (
            <p className="py-10 text-center font-montserrat text-sm text-details-text-primary-2">{t("loading")}</p>
          )}
          {loadError && (
            <p role="alert" className="py-10 text-center font-montserrat text-sm text-details-error">
              {loadError}
            </p>
          )}

          {ready && (
            // `key={kudosId}` forces a fresh `KudosEditor` (and its Tiptap
            // instance) per kudos — `initialContent` only applies once, at
            // mount, so editing a second kudos in the same session must
            // remount rather than reuse the previous editor instance.
            <div key={kudosId} className="flex flex-col gap-5">
              <TitleField value={title} onChange={setTitle} />
              <KudosEditor
                initialContent={content}
                onContentChange={(html, empty) => {
                  setContent(html);
                  setIsContentEmpty(empty);
                }}
              />
              <HashtagField hashtags={hashtags} selectedIds={hashtagIds} onChange={setHashtagIds} />
              <KudosEditImageField
                existingImages={existingImages}
                onRemoveExisting={(path) =>
                  setExistingImages((prev) => prev.filter((image) => image.path !== path))
                }
                newFiles={newImageFiles}
                onNewFilesChange={setNewImageFiles}
              />
              {(validationMessage ?? submitError) && (
                <p
                  role="alert"
                  className="font-montserrat text-sm font-bold leading-6 tracking-[0.15px] text-details-error"
                >
                  {validationMessage ?? submitError}
                </p>
              )}
              <div className="flex justify-start gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="flex shrink-0 items-center gap-2 rounded border border-details-border bg-details-textbutton-normal px-4 py-2.5 font-montserrat text-xs font-bold text-details-text-primary-2 sm:px-6 sm:py-3 sm:text-sm"
                >
                  {t("cancelButton")}
                  <CloseIcon />
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-details-text-primary-1 px-4 py-2.5 font-montserrat text-base font-bold text-details-text-primary-2 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-lg"
                >
                  {submitting ? t("saveLoading") : t("saveButton")}
                  {!submitting && <SendIcon />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
