/**
 * SVG icons scoped to the Kudos Live Board card family (Phase 04). Kept
 * separate from `kudos-icons.tsx` (F001-owned, Send Kudos compose feature) so
 * neither feature has to touch the other's icon set. `ArrowIcon`/`LinkIcon`
 * are NOT duplicated here — the card reuses the exact same Figma assets
 * already exported from `kudos-icons.tsx` (`SendIcon` doubles as the
 * sender→recipient arrow, `LinkIcon` is the Copy Link glyph, `CloseIcon`
 * closes the image lightbox).
 */

/** Outline heart — Heart button, not-liked state. */
export function HeartOutlineIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 20.25L10.5225 18.9075C5.34 14.205 1.9925 11.1525 2.00003 7.35C1.99253 6.15731 2.42978 4.99988 3.22787 4.10201C4.02596 3.20414 5.13005 2.62958 6.32378 2.4925C7.2394 2.38635 8.16509 2.55622 8.98565 2.97928C9.80622 3.40234 10.4838 4.05958 10.9313 4.87C11.4225 5.6725 12.5775 5.6725 13.0688 4.87C13.5163 4.05958 14.1938 3.40234 15.0144 2.97928C15.8349 2.55622 16.7606 2.38635 17.6763 2.4925C18.87 2.62958 19.9741 3.20414 20.7722 4.10201C21.5703 4.99988 22.0075 6.15731 22 7.35C22 11.1525 18.66 14.205 13.4775 18.915L12 20.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Filled heart — Heart button, liked state. */
export function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 20.25L10.5225 18.9075C5.34 14.205 1.9925 11.1525 2.00003 7.35C1.99253 6.15731 2.42978 4.99988 3.22787 4.10201C4.02596 3.20414 5.13005 2.62958 6.32378 2.4925C7.2394 2.38635 8.16509 2.55622 8.98565 2.97928C9.80622 3.40234 10.4838 4.05958 10.9313 4.87C11.4225 5.6725 12.5775 5.6725 13.0688 4.87C13.5163 4.05958 14.1938 3.40234 15.0144 2.97928C15.8349 2.55622 16.7606 2.38635 17.6763 2.4925C18.87 2.62958 19.9741 3.20414 20.7722 4.10201C21.5703 4.99988 22.0075 6.15731 22 7.35C22 11.1525 18.66 14.205 13.4775 18.915L12 20.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Single filled star — StarBadge threshold marker (1-3 stars). */
export function StarIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2.5L14.9021 8.38295L21.4 9.33688L16.7 13.9172L17.8042 20.3881L12 17.3369L6.19577 20.3881L7.3 13.9172L2.6 9.33688L9.09789 8.38295L12 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Right-pointing chevron — "Xem chi tiết" link affordance. */
export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M9.5 5.5L16 12L9.5 18.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Left-pointing chevron — mirror of `ChevronRightIcon`, back-navigation affordance. */
export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14.5 5.5L8 12L14.5 18.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Incognito/mask glyph — anonymous sender avatar placeholder. */
export function IncognitoIcon({ className }: { className?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 15.5C2 12.5 4.5 9 7.5 9C9.5 9 10.8 10.2 12 10.2C13.2 10.2 14.5 9 16.5 9C19.5 9 22 12.5 22 15.5C22 17 20.8 17.8 19.5 17.3L17 16.3C16.3 16 15.5 16.2 15 16.8L14.2 17.8C13.1 19.1 10.9 19.1 9.8 17.8L9 16.8C8.5 16.2 7.7 16 7 16.3L4.5 17.3C3.2 17.8 2 17 2 15.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="12.5" r="1.25" fill="currentColor" />
      <circle cx="15.5" cy="12.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

/**
 * Flame glyph — sidebar D.1.4 "Số tim bạn nhận được" row's "🔥×2" badge
 * (Momorph ground truth, undocumented spec gap: the "×2" isn't tied to any
 * multiplier concept in the data model, purely a decorative badge next to
 * the label — see `sidebar-stats.tsx`).
 */
export function FireIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2C12 2 7 7.5 7 12.5C7 15.5 9.2 18 12 18C14.8 18 17 15.5 17 12.5C17 11 16.3 9.7 15.5 8.5C15.5 10 14.5 11 13.5 11C14 9 13 6 12 2Z"
        fill="currentColor"
      />
      <path
        d="M9.5 14C9.5 15.93 10.62 17.5 12 17.5C13.38 17.5 14.5 15.93 14.5 14C14.5 13 14 12.2 13.5 11.5C13.3 12.3 12.7 13 12 13C11.3 13 10.9 12.3 10.8 11.7C10.1 12.3 9.5 13 9.5 14Z"
        fill="var(--details-background)"
      />
    </svg>
  );
}
