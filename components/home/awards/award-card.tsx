import Image from "next/image";
import { UpRightArrowIcon } from "@/components/home/home-icons";

const AWARD_BG_SRC = "/home/Award_BG.png";

export interface AwardCardProps {
  nameImageSrc: string;
  nameImageAlt: string;
  nameImageWidth: number;
  nameImageHeight: number;
  /** itemSpacing of the "Awards-Name" wrapper — varies slightly per card instance. */
  nameWrapperGap: number;
  title: string;
  description: string;
  viewDetailLabel: string;
}

/**
 * One award card — background photo + wordmark image + title/description +
 * a static "view detail" affordance (no linked award-detail page exists yet
 * in the project, so this renders as a non-interactive `<button>` with no
 * `onClick`/route wired up; known limitation, not a bug).
 *
 * All 6 homepage award instances share Figma componentId `214:1032` — this
 * component is the single reusable implementation (code-rules.md rule 5). The
 * `mm:` traceability comments below carry each element's component-relative
 * Figma node id; the full per-instance id is `I<cardNodeId>;<relative-id>`
 * where cardNodeId is the instance root catalogued in AWARDS (2167:9075/76/
 * 77/79/80/81).
 */
export function AwardCard({
  nameImageSrc,
  nameImageAlt,
  nameImageWidth,
  nameImageHeight,
  nameWrapperGap,
  title,
  description,
  viewDetailLabel,
}: AwardCardProps) {
  return (
    // mm:214:1032
    <div className="flex w-full max-w-[336px] flex-col items-start gap-6">
      {/* mm:214:1019 — 336x336 photo + wordmark, wrapper radius/shadow matches the asset's own 24px corner radius (code-rules.md rule 2b) */}
      <div
        className="relative flex w-full items-center justify-center"
        style={{
          aspectRatio: "1 / 1",
          borderRadius: 24,
          boxShadow: "0 4px 4px 0 rgba(0, 0, 0, 0.25), 0 0 6px 0 #FAE287",
          mixBlendMode: "screen",
        }}
      >
        {/* mm:214:1019;81:2442 */}
        <Image
          src={AWARD_BG_SRC}
          alt=""
          width={336}
          height={336}
          className="absolute inset-0 h-full w-full border-[0.955px] border-details-text-primary-1 object-cover"
          style={{ borderRadius: 24 }}
        />

        {/* mm:214:1019;214:666 */}
        <div
          className="relative flex flex-col items-start justify-start"
          style={{ width: nameImageWidth, height: nameImageHeight, gap: nameWrapperGap }}
        >
          {/* mm: wordmark image — per-instance leaf node, see AWARDS[].nameImageNodeId */}
          <Image src={nameImageSrc} alt={nameImageAlt} width={nameImageWidth} height={nameImageHeight} />
        </div>
      </div>

      {/* mm:214:1020 */}
      <div className="flex w-full flex-col items-start gap-1">
        {/* mm:214:1021 */}
        <p className="w-full font-montserrat text-2xl leading-8 text-details-text-primary-1">{title}</p>
        {/* mm:214:1022 */}
        <p className="w-full font-montserrat text-base leading-6 tracking-[0.5px] text-details-text-secondary-1">
          {description}
        </p>

        {/* mm:214:1023 — visible text label, so no aria-label (would fail WCAG 2.5.3 "Label in Name") */}
        <button
          type="button"
          className="flex items-center gap-1 py-4 text-details-text-secondary-1"
        >
          {/* mm:214:1023;186:1937 */}
          <span className="flex items-center gap-1">
            {/* mm:214:1023;186:1937;186:1439 */}
            <span className="font-montserrat text-base font-medium leading-6 tracking-[0.15px]">
              {viewDetailLabel}
            </span>
          </span>
          {/* mm:214:1023;186:1441 */}
          <UpRightArrowIcon className="h-6 w-6 text-details-text-secondary-1" />
        </button>
      </div>
    </div>
  );
}
