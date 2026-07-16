"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CloseIcon } from "@/components/kudos/kudos-icons";

const MAX_VISIBLE_IMAGES = 5;
/** Mobile shows fewer thumbnails at once so each stays a legible size on a
 *  narrow card; the last mobile slot gets a "+N" overlay for the rest. */
const MOBILE_VISIBLE_IMAGES = 3;

type KudosImage = {
  path: string;
  url: string;
};

type KudosImageGalleryProps = {
  images: KudosImage[];
};

/**
 * Up to 5 thumbnails; clicking one opens a native `<dialog>` lightbox. Uses
 * plain `<img>` (not `next/image`) because the Supabase Storage host isn't in
 * `next.config.ts`'s `images.remotePatterns` allowlist — same as `image-field.tsx`.
 */
export function KudosImageGallery({ images }: KudosImageGalleryProps) {
  const t = useTranslations("KudosLiveBoard");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visible = images.slice(0, MAX_VISIBLE_IMAGES);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeIndex !== null && !dialog.open) {
      dialog.showModal();
    } else if (activeIndex === null && dialog.open) {
      dialog.close();
    }
  }, [activeIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function handleNativeClose() {
      setActiveIndex(null);
    }
    dialog.addEventListener("close", handleNativeClose);
    return () => dialog.removeEventListener("close", handleNativeClose);
  }, []);

  if (visible.length === 0) return null;

  const activeImage = activeIndex !== null ? visible[activeIndex] : null;

  return (
    <>
      <div className="flex w-full items-center gap-2 sm:gap-4">
        {visible.map((image, index) => {
          const isMobileOverflowSlot = index === MOBILE_VISIBLE_IMAGES - 1 && visible.length > MOBILE_VISIBLE_IMAGES;
          return (
            <button
              key={image.path}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={t("images.viewImage", { index: index + 1 })}
              className={`relative aspect-square w-full max-w-20 flex-1 overflow-hidden rounded-xl border border-details-border sm:max-w-28 ${index >= MOBILE_VISIBLE_IMAGES ? "hidden sm:block" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage host, not in next.config images allowlist */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              {isMobileOverflowSlot && (
                <span className="absolute inset-0 flex items-center justify-center bg-details-header-overlay font-montserrat text-sm font-bold text-details-text-secondary-1 sm:hidden">
                  +{visible.length - MOBILE_VISIBLE_IMAGES}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <dialog
        ref={dialogRef}
        className="h-screen max-h-screen w-screen max-w-screen overflow-y-auto bg-transparent p-0 backdrop:bg-details-header-overlay"
      >
        <div className="relative m-auto flex h-full w-full items-center justify-center p-10">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("images.close")}
            className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-details-textbutton-normal text-details-text-secondary-1"
          >
            <CloseIcon />
          </button>
          {activeImage && (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage host, not in next.config images allowlist
            <img
              src={activeImage.url}
              alt=""
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          )}
        </div>
      </dialog>
    </>
  );
}
