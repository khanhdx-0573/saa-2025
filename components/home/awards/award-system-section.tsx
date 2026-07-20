import { useTranslations } from "next-intl";
import { AwardCard } from "@/components/home/awards/award-card";

type AwardKey =
  | "topTalent"
  | "topProject"
  | "topProjectLeader"
  | "bestManager"
  | "signatureCreator"
  | "mvp";

interface AwardData {
  cardNodeId: string;
  nameImageNodeId: string;
  nameImageSrc: string;
  key: AwardKey;
  nameImageWidth: number;
  nameImageHeight: number;
  nameWrapperGap: number;
}

/**
 * Some description strings are genuinely duplicated across cards (Best
 * Manager / Signature 2025 - Creator / MVP all share the same sentence) —
 * that duplication exists in the Figma source itself and is preserved as-is
 * in messages/*.json, not a transcription error.
 */
const AWARDS: AwardData[] = [
  {
    cardNodeId: "2167:9075",
    nameImageNodeId: "I2167:9075;214:1019;214:666;10:951",
    nameImageSrc: "/home/Top_Talent.png",
    key: "topTalent",
    nameImageWidth: 221,
    nameImageHeight: 35,
    nameWrapperGap: 9.545,
  },
  {
    cardNodeId: "2167:9076",
    nameImageNodeId: "I2167:9076;214:1019;214:666;214:654",
    nameImageSrc: "/home/Top_Project.png",
    key: "topProject",
    nameImageWidth: 232,
    nameImageHeight: 35,
    nameWrapperGap: 10,
  },
  {
    cardNodeId: "2167:9077",
    nameImageNodeId: "I2167:9077;214:1019;214:666;214:655",
    nameImageSrc: "/home/Top_Project_Leader.png",
    key: "topProjectLeader",
    nameImageWidth: 232,
    nameImageHeight: 64,
    nameWrapperGap: 10,
  },
  {
    cardNodeId: "2167:9079",
    nameImageNodeId: "I2167:9079;214:1019;214:666;214:656",
    nameImageSrc: "/home/Best_Manager.png",
    key: "bestManager",
    nameImageWidth: 232,
    nameImageHeight: 30,
    nameWrapperGap: 10,
  },
  {
    cardNodeId: "2167:9080",
    nameImageNodeId: "I2167:9080;214:1019;214:666;214:657",
    nameImageSrc: "/home/Signature_2025_Creator.png",
    key: "signatureCreator",
    nameImageWidth: 232,
    nameImageHeight: 54,
    nameWrapperGap: 10,
  },
  {
    cardNodeId: "2167:9081",
    nameImageNodeId: "I2167:9081;214:1019;214:666;214:653",
    nameImageSrc: "/home/MVP.png",
    key: "mvp",
    nameImageWidth: 116,
    nameImageHeight: 52,
    nameWrapperGap: 5,
  },
];

/**
 * "Hệ thống giải thưởng" (Award System) region of the homepage (node
 * 2167:9068) — a section header followed by a 6-card award grid laid out as
 * two rows of 3. All 6 cards share Figma componentId `214:1032`, extracted
 * as the reusable `AwardCard` (code-rules.md rule 5).
 */
export function AwardSystemSection() {
  const t = useTranslations("HomePage");

  const altLabels: Record<AwardKey, string> = {
    topTalent: t("awards.topTalentAlt"),
    topProject: t("awards.topProjectAlt"),
    topProjectLeader: t("awards.topProjectLeaderAlt"),
    bestManager: t("awards.bestManagerAlt"),
    signatureCreator: t("awards.signatureCreatorAlt"),
    mvp: t("awards.mvpAlt"),
  };

  const row1 = AWARDS.slice(0, 3);
  const row2 = AWARDS.slice(3, 6);

  return (
    // mm:2167:9068
    <section className="w-full bg-details-background">
      <div className="flex w-full flex-col gap-20 px-6 py-16 lg:px-36 lg:py-24">
        {/* mm:2167:9069 */}
        <div className="flex w-full flex-col items-start gap-4">
          {/* mm:2167:9070 */}
          <p className="w-full font-montserrat text-2xl font-bold leading-8 text-details-text-secondary-1">
            {t("awards.eyebrow")}
          </p>
          {/* mm:2167:9071 */}
          <div className="h-px w-full bg-details-divider" />
          {/* mm:2167:9072 */}
          <div className="flex items-center gap-8">
            {/* mm:2167:9073 */}
            <h2 className="font-montserrat text-[57px] font-bold leading-[64px] tracking-[-0.25px] text-details-text-primary-1">
              {t("awards.heading")}
            </h2>
          </div>
        </div>

        {/* mm:5005:14974 */}
        <div className="flex w-full flex-col gap-20">
          {/* mm:2167:9074 */}
          <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-20">
            {row1.map((award) => (
              <AwardCard
                key={award.cardNodeId}
                nameImageSrc={award.nameImageSrc}
                nameImageAlt={altLabels[award.key]}
                nameImageWidth={award.nameImageWidth}
                nameImageHeight={award.nameImageHeight}
                nameWrapperGap={award.nameWrapperGap}
                title={t(`awards.cards.${award.key}.title`)}
                description={t(`awards.cards.${award.key}.description`)}
                viewDetailLabel={t("awards.viewDetailLabel")}
              />
            ))}
          </div>

          {/* mm:2167:9078 */}
          <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-20">
            {row2.map((award) => (
              <AwardCard
                key={award.cardNodeId}
                nameImageSrc={award.nameImageSrc}
                nameImageAlt={altLabels[award.key]}
                nameImageWidth={award.nameImageWidth}
                nameImageHeight={award.nameImageHeight}
                nameWrapperGap={award.nameWrapperGap}
                title={t(`awards.cards.${award.key}.title`)}
                description={t(`awards.cards.${award.key}.description`)}
                viewDetailLabel={t("awards.viewDetailLabel")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
