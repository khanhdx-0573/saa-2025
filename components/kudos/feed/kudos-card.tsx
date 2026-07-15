"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CopyLinkButton } from "@/components/kudos/feed/copy-link-button";
import { HashtagChips } from "@/components/kudos/feed/hashtag-chips";
import { HeartButton } from "@/components/kudos/feed/heart-button";
import { ChevronRightIcon } from "@/components/kudos/kudos-live-board-icons";
import { KudosCardParty, type KudosCardPartyProfile } from "@/components/kudos/feed/kudos-card-party";
import { KudosImageGallery } from "@/components/kudos/feed/kudos-image-gallery";
import { PenIcon, SendIcon } from "@/components/kudos/kudos-icons";
import { sanitizeKudosContentHtml } from "@/lib/kudos/sanitize-content-html";

export type KudosCardData = {
  id: string;
  /** `null` exactly when `isAnonymous` is true — no sender identity persisted. */
  sender: KudosCardPartyProfile | null;
  isAnonymous: boolean;
  anonymousDisplayName: string | null;
  recipient: KudosCardPartyProfile;
  /** Badge/headline text, distinct from `#hashtags`. */
  title: string;
  content: string;
  /** ISO timestamp; formatted for display as "HH:mm - MM/DD/YYYY". */
  createdAt: string;
  hashtags: string[];
  images: { path: string; url: string }[];
  heartCount: number;
  likedByMe: boolean;
};

type KudosCardProps = {
  card: KudosCardData;
  /** 3 in Highlight, 5 in All Kudos/Detail. Doubles as the visual-context
   *  switch: also picks the bordered vs. borderless Figma card treatment. */
  contentLines: 3 | 5;
  showImages: boolean;
  /** BR-04: a user can't like their own kudos — container computes this
   *  (needs current-user identity, out of scope for a props-only component).
   *  Defaults to false so the heart stays interactive unless told otherwise. */
  heartDisabled?: boolean;
  /** `{origin}/kudos/{id}` — computed by the container. */
  detailUrl: string;
  /** `false` on the Detail page only — shows the message in full, no clamp.
   *  Decoupled from `contentLines` because Detail shares `contentLines={5}`
   *  with All Kudos yet needs different truncation. Defaults to `true`. */
  truncateContent?: boolean;
  /** Only the sender may edit — container computes this. Never shown on the
   *  Highlight card style regardless of this flag (only the All Kudos/Detail
   *  card has an edit pencil). */
  canEdit?: boolean;
  onLike: (kudosId: string) => void;
  onOpenDetail: (kudosId: string) => void;
  onOpenProfile: (profileId: string) => void;
  onEdit?: (kudosId: string) => void;
};

function formatCardTimestamp(iso: string): string {
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${hh}:${mm} - ${month}/${day}/${date.getFullYear()}`;
}

const CONTENT_LINE_CLAMP: Record<3 | 5, string> = {
  3: "line-clamp-3",
  5: "line-clamp-5",
};

/**
 * Shared Kudos Card, consumed by Highlight (`contentLines=3`, no images),
 * All Kudos (`contentLines=5`, `showImages`), and Detail (same as All Kudos
 * but `truncateContent=false`). Highlight gets the bordered treatment,
 * All Kudos/Detail the borderless one — same field set, different chrome.
 */
export function KudosCard({
  card,
  contentLines,
  showImages,
  heartDisabled = false,
  detailUrl,
  truncateContent = true,
  canEdit = false,
  onLike,
  onOpenDetail,
  onOpenProfile,
  onEdit,
}: KudosCardProps) {
  const t = useTranslations("KudosLiveBoard");
  const isHighlightStyle = contentLines === 3;
  // `card.content` is Tiptap-authored HTML, not plain text — sanitize (allowlist-
  // only; the RPC path does no server-side HTML validation) before rendering as
  // real HTML. Memoized since sanitizing walks the DOM.
  const sanitizedContent = useMemo(() => sanitizeKudosContentHtml(card.content), [card.content]);
  const shellClassName = isHighlightStyle
    ? "flex w-full flex-col gap-4 rounded-2xl border-4 border-details-text-primary-1 bg-details-modal-background px-6 pt-6 pb-4"
    : "flex w-full flex-col gap-4 rounded-3xl bg-details-modal-background px-10 pt-10 pb-4";

  return (
    <article className={shellClassName}>
      <div className="flex w-full items-start justify-between gap-6">
        <KudosCardParty
          profile={card.sender}
          isAnonymous={card.isAnonymous}
          anonymousDisplayName={card.anonymousDisplayName}
          onOpenProfile={onOpenProfile}
        />
        <span className="flex shrink-0 items-center self-center py-4 text-details-text-primary-2">
          <SendIcon />
        </span>
        <KudosCardParty profile={card.recipient} onOpenProfile={onOpenProfile} />
      </div>

      <div className="h-px w-full bg-details-text-primary-1" />

      <div className="flex w-full flex-col gap-4">
        <span className="font-montserrat text-base font-bold tracking-[0.5px] text-details-text-secondary-2">
          {formatCardTimestamp(card.createdAt)}
        </span>
        <div className="flex w-full items-center gap-2">
          <h3 className="flex-1 text-center font-montserrat text-base font-bold tracking-[0.5px] text-details-text-primary-2">
            {card.title}
          </h3>
          {/* Edit pencil is All Kudos/Detail only — never on Highlight. */}
          {!isHighlightStyle && canEdit && (
            <button
              type="button"
              onClick={() => onEdit?.(card.id)}
              aria-label={t("card.editButton")}
              title={t("card.editButton")}
              className="shrink-0 cursor-pointer text-details-text-primary-2 opacity-80 transition-opacity hover:opacity-100"
            >
              <PenIcon />
            </button>
          )}
        </div>
        {/* Content is intentionally a plain `<div>`, not a control: navigation
           happens only through the explicit "Xem chi tiết" button. */}
        <div className="w-full rounded-xl border border-details-text-primary-1 bg-details-text-primary-1/40 px-6 py-4 text-left">
          <div
            className={`font-montserrat text-xl leading-8 text-details-text-primary-2 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-details-border [&_blockquote]:pl-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 ${truncateContent ? CONTENT_LINE_CLAMP[contentLines] : ""} ${isHighlightStyle ? "min-h-24" : ""}`}
            // SSR renders an escaped plain-text fallback (no DOMParser server-side);
            // the client swaps in the sanitized rich HTML on hydration.
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
        <HashtagChips hashtags={card.hashtags} />
        {showImages && <KudosImageGallery images={card.images} />}
      </div>

      <div className="h-px w-full bg-details-text-primary-1" />

      <div className="flex w-full items-center justify-between gap-6">
        <HeartButton
          count={card.heartCount}
          liked={card.likedByMe}
          disabled={heartDisabled}
          onToggle={() => onLike(card.id)}
        />
        <div className="flex items-center gap-2">
          <CopyLinkButton url={detailUrl} />
          {/* "Xem chi tiết" is Highlight only — All Kudos/Detail show just
             heart + Copy Link. */}
          {isHighlightStyle && (
            <button
              type="button"
              onClick={() => onOpenDetail(card.id)}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded px-4 py-4 font-montserrat text-base font-bold text-details-text-primary-2 hover:bg-details-textbutton-normal"
            >
              {t("card.viewDetail")}
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
