"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CloseTinyIcon, PlusIcon } from "@/components/kudos/kudos-icons";
import { isValidKudosImage, MAX_KUDOS_IMAGES } from "@/lib/kudos/validation";

export type ExistingKudosImage = { path: string; url: string };

type KudosEditImageFieldProps = {
  /** Already-uploaded images this kudos was sent with, minus any removed this session. */
  existingImages: ExistingKudosImage[];
  onRemoveExisting: (path: string) => void;
  /** Newly added files this session — not uploaded yet, uploaded only on Save. */
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
};

// Edit-modal counterpart to `image-field.tsx`: the source is split into
// already-uploaded `existingImages` (never re-uploaded) and `newFiles`
// (uploaded only on Save). Kept separate so ImageField's File[]-only contract
// stays simple — the compose flow never has existing images.
export function KudosEditImageField({
  existingImages,
  onRemoveExisting,
  newFiles,
  onNewFilesChange,
}: KudosEditImageFieldProps) {
  const t = useTranslations("KudosModal");
  const inputRef = useRef<HTMLInputElement>(null);
  const urlMapRef = useRef<Map<File, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urlMap = urlMapRef.current;
    for (const [file, url] of urlMap) {
      if (!newFiles.includes(file)) {
        URL.revokeObjectURL(url);
        urlMap.delete(file);
      }
    }
    for (const file of newFiles) {
      if (!urlMap.has(file)) urlMap.set(file, URL.createObjectURL(file));
    }
    setPreviewUrls(newFiles.map((file) => urlMap.get(file) ?? ""));
  }, [newFiles]);

  useEffect(() => {
    const urlMap = urlMapRef.current;
    return () => {
      for (const url of urlMap.values()) URL.revokeObjectURL(url);
      urlMap.clear();
    };
  }, []);

  const totalCount = existingImages.length + newFiles.length;
  const canAddMore = totalCount < MAX_KUDOS_IMAGES;

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const room = MAX_KUDOS_IMAGES - totalCount;
    const accepted: File[] = [];
    let hasInvalid = false;

    for (const file of incoming) {
      if (accepted.length >= room) break;
      if (isValidKudosImage(file)) accepted.push(file);
      else hasInvalid = true;
    }

    setError(hasInvalid ? t("imageInvalidError") : null);
    if (accepted.length > 0) onNewFilesChange([...newFiles, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeNewAt(index: number) {
    onNewFilesChange(newFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className="flex flex-1 items-start gap-4">
      <label className="w-[120px] shrink-0 whitespace-nowrap font-montserrat text-lg font-bold text-details-text-primary-2">
        {t("imageLabel")}
      </label>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {existingImages.map((image) => (
            <div key={image.path} className="relative h-16 w-16 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-[18px] border border-details-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a next/image-registered remote pattern */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onRemoveExisting(image.path)}
                aria-label={t("imageRemoveAlt")}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-details-remove-button text-details-text-secondary-1"
              >
                <CloseTinyIcon />
              </button>
            </div>
          ))}
          {newFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative h-16 w-16 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-[18px] border border-details-border">
                {previewUrls[index] && (
                  // eslint-disable-next-line @next/next/no-img-element -- blob: preview URLs are not supported by next/image
                  <img src={previewUrls[index]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeNewAt(index)}
                aria-label={t("imageRemoveAlt")}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-details-remove-button text-details-text-secondary-1"
              >
                <CloseTinyIcon />
              </button>
            </div>
          ))}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-details-border bg-details-text-secondary-1 px-2 py-1 hover:bg-details-textbutton-normal"
            >
              <PlusIcon className="text-details-text-secondary-2" />
              <span className="flex flex-col items-start leading-tight">
                <span className="font-montserrat text-xs font-bold tracking-wide text-details-text-primary-2">
                  {t("addImageButton")}
                </span>
                <span className="font-montserrat text-xs font-bold tracking-wide text-details-text-secondary-2">
                  {t("imageMaxHint")}
                </span>
              </span>
            </button>
          )}
        </div>
        {error && <p className="font-montserrat text-sm text-details-error">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(event) => handleFilesSelected(event.target.files)}
        />
      </div>
    </div>
  );
}
