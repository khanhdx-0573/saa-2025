import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UpRightArrowIcon } from "@/components/home/home-icons";
import { SunKudosLogoMark } from "@/components/home/sunkudos/sunkudos-logo-mark";

/**
 * Homepage "SunKudos" promo section (MoMorph `mms_D1_Sunkudos`, node
 * `3390:10349`) — a self-contained teaser/CTA card linking to the existing
 * `/kudos` feature. This is NOT the kudos feature itself: no imports from
 * `components/kudos/` or `lib/kudos/`, no data fetching — copy is seeded via
 * i18n only, matching the Figma design's static content.
 *
 * Layout: the reference frame is a fixed 1120x500 card sitting inside a wider
 * 1224px slot that only centers it horizontally (Figma `alignItems: center`)
 * — the containered-layout pattern (rule 3). The card's inner regions
 * (content block, decorative frame, wordmark) are absolutely positioned in
 * the source; they're reproduced here as percentage insets of the 1120x500
 * reference so the whole card scales as one unit on any viewport instead of
 * being pinned to a rigid pixel width.
 */
export function SunKudosSection() {
  const t = useTranslations("HomePage");

  return (
    // mm:3390:10349
    <section className="flex w-full flex-col items-center justify-center px-6 py-16 lg:px-0 lg:py-24">
      {/* mm:I3390:10349;313:8415 */}
      <div className="relative aspect-[1120/500] w-full max-w-[1120px] overflow-hidden rounded-2xl">
        {/* mm:I3390:10349;313:8416 */}
        <Image
          src="/home/Kudos_Background.png"
          alt=""
          fill
          sizes="(min-width: 1120px) 1120px, 100vw"
          className="rounded-2xl object-cover"
        />

        {/* mm:I3390:10349;313:8419 */}
        <div className="absolute top-[9.2%] left-[5.71%] flex w-[40.8%] min-w-[280px] flex-col items-start justify-center gap-8">
          {/* mm:I3390:10349;313:8420 */}
          <div className="flex w-full flex-col items-start justify-start gap-4">
            {/* mm:I3390:10349;313:8421 */}
            <p className="font-montserrat text-2xl leading-8 font-bold tracking-normal text-details-text-secondary-1">
              {t("sunkudos.heading")}
            </p>
            {/* mm:I3390:10349;313:8422 */}
            <h2 className="font-montserrat text-[57px] leading-[64px] font-bold tracking-[-0.25px] text-details-text-primary-1">
              {t("sunkudos.title")}
            </h2>
            {/* mm:I3390:10349;313:8423 */}
            <p className="font-montserrat text-base leading-6 font-bold tracking-[0.5px] whitespace-pre-line text-justify text-details-text-secondary-1">
              {t("sunkudos.body")}
            </p>
          </div>

          {/* mm:I3390:10349;313:8424 */}
          <div className="flex w-full flex-col items-start justify-start gap-6">
            {/* mm:I3390:10349;313:8426 */}
            <Link
              href="/kudos"
              className="flex flex-row items-center justify-start gap-2 rounded bg-details-text-primary-1 p-4 text-details-text-primary-2"
            >
              {/* mm:I3390:10349;313:8426;186:1935 */}
              <span className="flex flex-row items-center justify-start gap-1">
                {/* mm:I3390:10349;313:8426;186:1568 */}
                <span className="font-montserrat text-base leading-6 font-bold tracking-[0.15px] text-center">
                  {t("sunkudos.cta")}
                </span>
              </span>
              {/* mm:I3390:10349;313:8426;186:1766 */}
              <UpRightArrowIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>

        {/* mm:I3390:10349;313:8417 — empty decorative frame in source (no fill/content) */}
        <div className="absolute top-[28.4%] left-[65.71%] h-[43.8%] w-[23.57%]" />

        {/* mm:I3390:10349;329:2948 */}
        <div
          className="absolute top-[43%] left-[60%] h-[14.4%] w-[32.5%]"
          role="img"
          aria-label={t("sunkudos.logoAlt")}
        >
          <SunKudosLogoMark className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
