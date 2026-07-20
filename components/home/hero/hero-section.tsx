import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UpRightArrowIcon } from "@/components/home/home-icons";
import { CountdownTimer } from "@/components/home/hero/countdown-timer";

function EventInfoItem({ label, value }: { label: string; value: string }) {
  return (
    // mm:2167:9055 (Group 417) / mm:2167:9058 (Group 418)
    <p className="flex items-center gap-1 font-montserrat">
      {/* mm:2167:9056 / mm:2167:9060 */}
      <span className="text-base font-bold leading-6 tracking-[0.15px] text-details-text-secondary-1">
        {label}
      </span>
      {/* mm:2167:9057 / mm:2167:9059 */}
      <span className="text-2xl font-bold leading-8 text-details-text-primary-1">{value}</span>
    </p>
  );
}

function CtaButton({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <Link
      href={href}
      className={
        isPrimary
          ? "flex items-center gap-2 rounded-lg bg-details-text-primary-1 px-6 py-4 text-details-text-primary-2 transition-colors hover:bg-details-text-primary-1/90"
          : "flex items-center gap-2 rounded-lg border border-details-border bg-details-textbutton-normal px-6 py-4 text-details-text-secondary-1 transition-colors hover:bg-details-textbutton-normal/70"
      }
    >
      {/* mm:I2167:9063;186:1935 (About) / mm:I2167:9064;186:2758 (Kudos) */}
      <span className="font-montserrat text-[22px] font-bold uppercase leading-7">{label}</span>
      {/* mm:I2167:9063;186:1766 (About) / mm:I2167:9064;186:2761 (Kudos) */}
      <UpRightArrowIcon className="h-6 w-6" />
    </Link>
  );
}

/**
 * Hero region of the Homepage SAA screen — Root Further logo, ceremony
 * countdown, event info and the two primary CTAs. The keyvisual image +
 * gradient live at the page root (app/page.tsx), not here — hoisted so they
 * bleed up behind the Header too. Server component; only the countdown ticks
 * client-side (see countdown-timer.tsx).
 */
export function HeroSection() {
  const tHero = useTranslations("HomePage.hero");

  return (
    <section className="relative w-full">
      {/* mm:2167:9031 */}
      <div className="flex w-full flex-col items-start justify-start gap-10 px-6 py-16 lg:px-36 lg:py-24">
        {/* mm:2167:9032 */}
        <div className="flex flex-col items-start justify-start gap-2.5">
          {/* mm:2788:12911 */}
          <Image
            src="/home/Root_Further_Logo.png"
            alt={tHero("logoAlt")}
            width={451}
            height={200}
            priority
            className="h-auto w-[220px] lg:w-[451px]"
          />
        </div>

        {/* mm:2167:9034 */}
        <div className="flex w-full flex-col items-start justify-start gap-4">
          {/* mm:2167:9035 */}
          <div className="flex w-full flex-col items-start justify-start gap-4">
            {/* mm:2167:9036 */}
            <p className="font-montserrat text-2xl font-bold leading-8 text-details-text-secondary-1">
              {tHero("comingSoon")}
            </p>
            <CountdownTimer />
          </div>

          {/* mm:2167:9053 */}
          <div className="flex w-full flex-col items-start justify-start gap-2">
            {/* mm:2167:9054 */}
            <div className="flex flex-wrap items-center justify-start gap-[60px]">
              <EventInfoItem
                label={tHero("eventInfo.timeLabel")}
                value={tHero("eventInfo.timeValue")}
              />
              <EventInfoItem
                label={tHero("eventInfo.locationLabel")}
                value={tHero("eventInfo.locationValue")}
              />
            </div>
            {/* mm:2167:9061 */}
            <p className="font-montserrat text-base font-bold leading-6 tracking-[0.5px] text-details-text-secondary-1">
              {tHero("liveNote")}
            </p>
          </div>
        </div>

        {/* mm:2167:9062 */}
        <div className="mt-6 flex flex-wrap items-start justify-start gap-10">
          {/* mm:2167:9063 */}
          <CtaButton href="/about-saa-2025" label={tHero("ctaAbout")} variant="primary" />
          {/* mm:2167:9064 */}
          <CtaButton href="/kudos" label={tHero("ctaKudos")} variant="secondary" />
        </div>
      </div>
    </section>
  );
}
