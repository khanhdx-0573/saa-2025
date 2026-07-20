import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * "Root Further" theme-content region of the homepage (Frame 486 / node
 * 3204:10152). Two stacked wordmark images ("Root" over "Further") followed
 * by an essay paragraph, a bilingual pull-quote, and a closing paragraph.
 * Static/presentational — copy comes from the `HomePage.rootFurther`
 * translation namespace (already transcribed verbatim from Figma).
 */
export function RootFurtherSection() {
  const t = useTranslations("HomePage");

  return (
    // mm:3204:10152 — overlaps the tail of the page-root keyvisual image
    // (see app/page.tsx) via a negative top margin scaled to viewport width
    // (matching the image's own width-driven aspect ratio). No own
    // background: bg-details-background on the page root shows through once
    // the keyvisual box ends, matching the design's seamless dark transition.
    <section className="w-full lg:-mt-[5vw]">
      <div className="mx-auto flex w-full max-w-[1152px] flex-col items-center justify-center gap-8 px-6 py-16 lg:px-[104px] lg:py-[120px]">
        {/* mm:3204:10153 — stacked "Root" / "Further" wordmark images */}
        <div className="relative h-[134px] w-[290px] shrink-0">
          {/* mm:3204:10155 */}
          <Image
            src="/home/Root_Text.png"
            alt="Root"
            width={189}
            height={67}
            className="absolute left-[51px] top-0"
          />
          {/* mm:3204:10154 */}
          <Image
            src="/home/Further_Text.png"
            alt="Further"
            width={290}
            height={67}
            className="absolute left-0 top-[67px]"
          />
        </div>

        {/* mm:5001:14827 */}
        <div className="flex w-full flex-col gap-8">
          {/* mm:3204:10156 */}
          <p className="w-full whitespace-pre-line text-justify font-montserrat text-[24px] font-bold leading-[32px] text-details-text-secondary-1">
            {t("rootFurther.paragraph1")}
          </p>

          {/* mm:3204:10161 */}
          <p className="w-full whitespace-pre-line text-center font-montserrat text-[20px] font-bold leading-[32px] text-details-text-secondary-1">
            {t("rootFurther.quote")}
          </p>

          {/* mm:3204:10162 */}
          <p className="w-full whitespace-pre-line text-justify font-montserrat text-[24px] font-bold leading-[32px] text-details-text-secondary-1">
            {t("rootFurther.paragraph3")}
          </p>
        </div>
      </div>
    </section>
  );
}
