import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";

/**
 * Static "coming soon"-style mock page behind the header's "About SAA 2025"
 * tab (FR-004). No live data, no backend — placeholder copy only, per the
 * business context. Auth-gating is inherited automatically from the existing
 * global middleware (`proxy.ts` → `lib/supabase/middleware.ts`), so this page
 * needs no gating code of its own (FR-009).
 */
export default function AboutSaaPage() {
  const t = useTranslations("AboutSaaPage");

  return (
    <div className="flex min-h-screen flex-col bg-details-background">
      <Header />

      <main className="flex flex-1 flex-col items-start gap-6 px-6 py-16 lg:px-36 lg:py-24">
        <h1 className="font-montserrat-alternates text-3xl font-bold text-details-text-secondary-1 lg:text-4xl">
          {t("heading")}
        </h1>
        <p className="max-w-[720px] font-montserrat text-base leading-8 text-details-text-secondary-1">
          {t("intro")}
        </p>
        <ul className="flex max-w-[720px] flex-col gap-3 font-montserrat text-base leading-8 text-details-text-secondary-1">
          <li>{t("bulletTimeline")}</li>
          <li>{t("bulletCategories")}</li>
          <li>{t("bulletCommunity")}</li>
        </ul>
      </main>

      <Footer />
    </div>
  );
}
