"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { CloseIcon, LinkIcon } from "@/components/kudos/kudos-icons";
import { isValidLinkUrl, MAX_LINK_TEXT_CHARS } from "@/lib/kudos/validation";

type KudosEditorLinkDialogProps = {
  open: boolean;
  initialText: string;
  initialUrl: string;
  onCancel: () => void;
  onSave: (text: string, url: string) => void;
};

/**
 * "Thêm đường dẫn" dialog per MoMorph screen OyDLDuSGEa ("Addlink Box"):
 * separate Text + Link fields, Hủy/Lưu buttons. Opened either with a
 * selection already made (Text pre-filled with the highlighted string) or
 * with an empty selection (Text starts blank) — both paths save through the
 * same `onSave(text, url)` contract, so the caller decides whether that
 * replaces a range or inserts fresh linked text.
 */
export function KudosEditorLinkDialog({ open, initialText, initialUrl, onCancel, onSave }: KudosEditorLinkDialogProps) {
  const t = useTranslations("KudosModal.linkDialog");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const [showErrors, setShowErrors] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Deliberate mount-detection: SSR and the first client render both output null,
  // avoiding a portal hydration mismatch (this dialog only ever appears post-mount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setText(initialText);
      setUrl(initialUrl);
      setShowErrors(false);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync on open transitions, not every keystroke
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleNativeClose() {
      onCancel();
    }
    dialog.addEventListener("close", handleNativeClose);
    return () => dialog.removeEventListener("close", handleNativeClose);
  }, [onCancel]);

  const trimmedText = text.trim();
  const hasTextError = trimmedText.length === 0 || trimmedText.length > MAX_LINK_TEXT_CHARS;
  const hasUrlError = !isValidLinkUrl(url.trim());

  function handleSave() {
    if (hasTextError || hasUrlError) {
      setShowErrors(true);
      return;
    }
    onSave(trimmedText, url.trim());
  }

  if (!mounted) return null;

  // Portaled to `document.body`: nested inside the KudosModal's own <dialog>,
  // the outer modal's inert-everything-else behavior intercepts clicks on this
  // dialog's buttons, so it must live outside that subtree.
  return createPortal(
    <dialog
      ref={dialogRef}
      className="h-screen max-h-screen w-screen max-w-screen overflow-y-auto bg-transparent p-0 backdrop:bg-details-header-overlay"
    >
      <div className="flex min-h-full">
        <div className="m-auto flex w-[752px] max-w-full flex-col gap-8 rounded-3xl bg-details-modal-background p-10">
          <h2 className="font-montserrat text-[32px] font-bold text-details-text-primary-2">{t("title")}</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="w-[146px] shrink-0 whitespace-nowrap font-montserrat text-[22px] font-bold text-details-text-primary-2">
                {t("textLabel")}
              </label>
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_LINK_TEXT_CHARS}
                aria-invalid={showErrors && hasTextError}
                placeholder={t("textPlaceholder")}
                className={`h-14 flex-1 rounded-lg border bg-details-text-secondary-1 px-6 font-montserrat text-base font-bold text-details-text-primary-2 placeholder:text-details-text-secondary-2 focus:outline-none ${
                  showErrors && hasTextError ? "border-details-error" : "border-details-border"
                }`}
              />
            </div>
            {showErrors && hasTextError && (
              <p className="font-montserrat text-sm text-details-error">{t("textRequiredError")}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label className="w-[146px] shrink-0 whitespace-nowrap font-montserrat text-[22px] font-bold text-details-text-primary-2">
                {t("linkLabel")}
              </label>
              <input
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                aria-invalid={showErrors && hasUrlError}
                placeholder={t("placeholder")}
                className={`h-14 flex-1 rounded-lg border bg-details-text-secondary-1 px-6 font-montserrat text-base font-bold text-details-text-primary-2 placeholder:text-details-text-secondary-2 focus:outline-none ${
                  showErrors && hasUrlError ? "border-details-error" : "border-details-border"
                }`}
              />
            </div>
            {showErrors && hasUrlError && (
              <p className="font-montserrat text-sm text-details-error">{t("linkInvalidError")}</p>
            )}
          </div>
          <div className="flex justify-start gap-6">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex shrink-0 items-center gap-2 rounded border border-details-border bg-details-textbutton-normal px-10 py-4 font-montserrat text-base font-bold text-details-text-primary-2"
            >
              {t("cancel")}
              <CloseIcon />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-details-text-primary-1 px-4 py-4 font-montserrat text-[22px] font-bold text-details-text-primary-2"
            >
              {t("save")}
              <LinkIcon />
            </button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
