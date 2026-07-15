"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { AnonymousToggle } from "@/components/kudos/compose/anonymous-toggle";
import { HashtagField } from "@/components/kudos/compose/hashtag-field";
import { CloseIcon, SendIcon } from "@/components/kudos/kudos-icons";
import { ImageField } from "@/components/kudos/compose/image-field";
import { KudosEditor, type KudosEditorHandle } from "@/components/kudos/compose/kudos-editor";
import { RecipientField } from "@/components/kudos/compose/recipient-field";
import { TitleField } from "@/components/kudos/compose/title-field";
import { listHashtags } from "@/lib/kudos/queries";
import { uploadKudosImages, createKudos } from "@/lib/kudos/mutations";
import { useKudosForm } from "@/lib/kudos/use-kudos-form";
import type { Hashtag } from "@/lib/kudos/types";

type KudosModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Top-level "Viết Kudo" compose modal shell. Uses a native `<dialog>` for
 * focus-trap + ESC-to-close (no modal primitive exists in `components/ui/`
 * yet, per phase-04 Key Insights). Every close path — ESC, Cancel, and a
 * successful Submit — routes through `dialog.close()`, so the form state
 * only ever resets in one place: the native `close` event listener below.
 */
export function KudosModal({ open, onClose }: KudosModalProps) {
  const t = useTranslations("KudosModal");
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editorRef = useRef<KudosEditorHandle>(null);
  const closeHandlerRef = useRef<() => void>(() => {});
  const hasFetchedHashtags = useRef(false);

  const form = useKudosForm();
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    closeHandlerRef.current = () => {
      form.reset();
      setHasAttemptedSubmit(false);
      setSubmitError(null);
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
    if (open && !dialog.open) {
      dialog.showModal();
      if (!hasFetchedHashtags.current) {
        hasFetchedHashtags.current = true;
        listHashtags()
          .then(setHashtags)
          .catch(() => setHashtags([]));
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const validationMessage = hasAttemptedSubmit && !form.canSubmit ? t("submitValidationError") : null;

  async function handleSubmit() {
    if (!form.canSubmit) {
      setHasAttemptedSubmit(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const imagePaths = form.images.length > 0 ? await uploadKudosImages(form.images) : [];
      const mentionedProfileIds = editorRef.current?.getMentionedIds() ?? [];
      await createKudos(form.toCreateKudosInput(imagePaths, mentionedProfileIds));
      dialogRef.current?.close();
      // Notify the feed to refetch so the new kudos appears immediately.
      window.dispatchEvent(new CustomEvent("kudos:created"));
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
         when the form is taller than the viewport — `m-auto` alone collapses
         to a flush 0px gap once there's no leftover space left to center
         into, which read as the modal "overflowing" the screen edges. */}
      <div className="flex min-h-full py-2.5 px-3 sm:px-0">
        {/* fix-bug: shrunk the whole shell (width/padding/gaps/font sizes)
           — the form was running noticeably taller than the viewport on
           typical screens. Proportions/hierarchy stay the same, just at a
           smaller scale. */}
        <div className="m-auto flex w-[680px] max-w-full flex-col gap-4 rounded-2xl bg-details-modal-background p-4 sm:gap-5 sm:rounded-3xl sm:p-7">
          <h2 className="whitespace-pre-line text-center font-montserrat text-xl font-bold leading-7 text-details-text-primary-2 sm:text-[26px] sm:leading-9">
            {t("title")}
          </h2>
          <RecipientField value={form.recipient} onChange={form.setRecipient} excludeUserId={user?.id} />
          <TitleField value={form.title} onChange={form.setTitle} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <KudosEditor ref={editorRef} onContentChange={form.setContent} />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <HashtagField hashtags={hashtags} selectedIds={form.hashtagIds} onChange={form.setHashtagIds} />
            </div>
            <ImageField images={form.images} onChange={form.setImages} />
          </div>
          <AnonymousToggle
            isAnonymous={form.isAnonymous}
            onToggle={form.setIsAnonymous}
            name={form.anonymousName}
            onNameChange={form.setAnonymousName}
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
              {submitting ? t("submitLoading") : t("submitButton")}
              {!submitting && <SendIcon />}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
