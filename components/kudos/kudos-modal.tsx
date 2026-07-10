"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { AnonymousToggle } from "@/components/kudos/anonymous-toggle";
import { HashtagField } from "@/components/kudos/hashtag-field";
import { CloseIcon, SendIcon } from "@/components/kudos/kudos-icons";
import { ImageField } from "@/components/kudos/image-field";
import { KudosEditor, type KudosEditorHandle } from "@/components/kudos/kudos-editor";
import { RecipientField } from "@/components/kudos/recipient-field";
import { TitleField } from "@/components/kudos/title-field";
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
      <div className="flex min-h-full">
        <div className="m-auto flex w-[752px] max-w-full flex-col gap-8 rounded-3xl bg-details-modal-background p-10">
          <h2 className="whitespace-pre-line text-center font-montserrat text-[32px] font-bold leading-10 text-details-text-primary-2">
            {t("title")}
          </h2>
          <RecipientField value={form.recipient} onChange={form.setRecipient} excludeUserId={user?.id} />
          <TitleField value={form.title} onChange={form.setTitle} />
          <div className="flex flex-col gap-6">
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
              className="font-montserrat text-base font-bold leading-6 tracking-[0.15px] text-details-error"
            >
              {validationMessage ?? submitError}
            </p>
          )}
          <div className="flex justify-start gap-6">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex shrink-0 items-center gap-2 rounded border border-details-border bg-details-textbutton-normal px-10 py-4 font-montserrat text-base font-bold text-details-text-primary-2"
            >
              {t("cancelButton")}
              <CloseIcon />
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-details-text-primary-1 px-4 py-4 font-montserrat text-[22px] font-bold text-details-text-primary-2 disabled:cursor-not-allowed disabled:opacity-50"
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
