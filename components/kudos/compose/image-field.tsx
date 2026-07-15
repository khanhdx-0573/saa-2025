"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CloseTinyIcon, PlusIcon } from "@/components/kudos/kudos-icons";
import { isValidKudosImage, MAX_KUDOS_IMAGES } from "@/lib/kudos/validation";

type ImageFieldProps = {
  images: File[];
  onChange: (files: File[]) => void;
};

// "Hình ảnh" field: file input + "+ Image" trigger + thumbnail grid. Rejected
// files surface `imageInvalidError` rather than being silently dropped. Blob
// preview URLs are revoked on remove AND unmount to avoid leaking memory.
export function ImageField({ images, onChange }: ImageFieldProps) {
  const t = useTranslations("KudosModal");
  const inputRef = useRef<HTMLInputElement>(null);
  const urlMapRef = useRef<Map<File, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urlMap = urlMapRef.current;
    for (const [file, url] of urlMap) {
      if (!images.includes(file)) {
        URL.revokeObjectURL(url);
        urlMap.delete(file);
      }
    }
    for (const file of images) {
      if (!urlMap.has(file)) urlMap.set(file, URL.createObjectURL(file));
    }
    setPreviewUrls(images.map((file) => urlMap.get(file) ?? ""));
  }, [images]);

  useEffect(() => {
    const urlMap = urlMapRef.current;
    return () => {
      for (const url of urlMap.values()) URL.revokeObjectURL(url);
      urlMap.clear();
    };
  }, []);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const room = MAX_KUDOS_IMAGES - images.length;
    const accepted: File[] = [];
    let hasInvalid = false;

    for (const file of incoming) {
      if (accepted.length >= room) break;
      if (isValidKudosImage(file)) accepted.push(file);
      else hasInvalid = true;
    }

    setError(hasInvalid ? t("imageInvalidError") : null);
    if (accepted.length > 0) onChange([...images, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(images.filter((_, fileIndex) => fileIndex !== index));
  }

  const canAddMore = images.length < MAX_KUDOS_IMAGES;

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <label className="font-montserrat text-lg font-bold text-details-text-primary-2 sm:w-[120px] sm:shrink-0 sm:whitespace-nowrap">
        {t("imageLabel")}
      </label>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {images.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative h-16 w-16 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-[18px] border border-details-border">
                {previewUrls[index] && (
                  // eslint-disable-next-line @next/next/no-img-element -- blob: preview URLs are not supported by next/image
                  <img src={previewUrls[index]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
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
