import Image from "next/image";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { HeroSection } from "@/components/home/hero/hero-section";
import { RootFurtherSection } from "@/components/home/root-further/root-further-section";
import { AwardSystemSection } from "@/components/home/awards/award-system-section";
import { SunKudosSection } from "@/components/home/sunkudos/sunkudos-section";
import { FloatingWidgetButton } from "@/components/home/widget/floating-widget-button";

/**
 * Homepage (MoMorph "Homepage SAA", screen i87tDx10uM) — keyvisual hero,
 * Root Further brand statement, award system, and Sun* Kudos promo, in the
 * order they appear in the design. Static/presentational: all copy comes
 * from i18n, all images are seeded design assets — no backend/data fetching.
 * Auth-gating is inherited from the global middleware (proxy.ts →
 * lib/supabase/middleware.ts), so no gating code is needed here.
 *
 * The keyvisual image + gradient are hoisted to the page root (not owned by
 * HeroSection) so they bleed up behind the Header too, matching the
 * transparent-header-over-keyvisual pattern already used by app/login/page.tsx
 * and app/kudos/page.tsx — Header's own bg-details-header-overlay is
 * semi-transparent by design for exactly this.
 */
export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <div className="relative flex min-h-screen flex-col bg-details-background">
      {/* mm:2167:9027-9029 */}
      <div className="absolute inset-x-0 top-0 overflow-hidden lg:aspect-[1512/1480]">
        <Image
          src="/home/Keyvisual_BG.png"
          alt={t("keyvisualAlt")}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(12deg, #00101A 23.7%, rgba(0, 18, 29, 0.46) 38.34%, rgba(0, 19, 32, 0.00) 48.92%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <Header />

        <main className="flex flex-1 flex-col">
          <HeroSection />
          <RootFurtherSection />
          <AwardSystemSection />
          <SunKudosSection />
        </main>

        <Footer />
        <FloatingWidgetButton />
      </div>
    </div>
  );
}
