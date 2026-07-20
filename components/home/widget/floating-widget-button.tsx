"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { KudosMarkIcon, PenIcon } from "@/components/home/home-icons";

/** Keyboard-focus ring, same pattern as header.tsx's icon buttons. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-details-text-primary-1 focus-visible:rounded-full";

/**
 * Floating widget button cluster (Figma node 5022:15169, "mms_6_Widget
 * Button") — a small pill fixed to the bottom-right corner of the viewport
 * on every scroll position, per the MoMorph spec item "6"
 * ("nổi và cố định ở mép phải bên dưới màn hình") and test cases ID-7 /
 * ID-54 ("Widget button fixed bottom right").
 *
 * Two independently actionable icon buttons live inside one pill:
 *  - pen icon ("icon viết kudos") → navigates straight to /kudos, the
 *    existing compose flow
 *  - SAA logo icon ("icon thể lệ saa") → placeholder button; no "rules"
 *    route exists in the project yet, so it renders inert (no onClick)
 *
 * Known deviation from the raw spec: the MoMorph description/test case
 * ID-54 say clicking the pill opens a "quick action menu", but no menu
 * content is defined anywhere beyond these same two icons, so per
 * implementation instructions each icon acts directly instead of behind a
 * menu toggle. Flag for the orchestrator if a real quick-action menu is
 * expected later.
 */
export function FloatingWidgetButton() {
  const t = useTranslations("HomePage");

  return (
    // mm:5022:15169
    <div className="fixed bottom-[19px] right-[19px] z-30 inline-flex rounded-[100px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25),0_0_6px_0_#FAE287]">
      {/* mm:I5022:15169;214:3839 */}
      <div className="flex flex-row items-center justify-start gap-2 rounded-[100px] bg-details-text-primary-1 p-4">
        {/* mm:I5022:15169;214:3839;186:1935 — "write kudos" hit area: pen icon + "/" separator */}
        <Link
          href="/kudos"
          aria-label={t("widget.writeKudosAriaLabel")}
          className={`flex h-8 w-[42px] flex-row items-center justify-start gap-2 text-details-background transition-opacity hover:opacity-70 active:opacity-50 ${FOCUS_RING}`}
        >
          {/* mm:I5022:15169;214:3839;186:1763 */}
          <PenIcon className="h-6 w-6 shrink-0" />
          {/* mm:I5022:15169;214:3839;186:1568 — decorative "/" separator between icons, not translatable copy */}
          <span aria-hidden="true" className="font-montserrat text-2xl font-bold leading-8">
            /
          </span>
        </Link>

        {/* mm:I5022:15169;214:3839;186:1766 — "SAA rules" icon button (no route yet, see file doc) */}
        <button
          type="button"
          aria-label={t("widget.rulesAriaLabel")}
          className={`relative h-6 w-6 shrink-0 transition-opacity hover:opacity-70 active:opacity-50 ${FOCUS_RING}`}
        >
          {/* mm:I5022:15169;214:3839;186:1766;214:3762 */}
          <KudosMarkIcon className="absolute left-0.5 top-0.5 h-[18px] w-5" />
        </button>
      </div>
    </div>
  );
}
