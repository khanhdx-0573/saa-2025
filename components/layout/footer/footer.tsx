import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="flex w-full justify-center border-t border-details-divider px-6 py-10 lg:px-[90px]">
      <p className="text-center font-montserrat-alternates text-base font-bold text-white">
        {t("copyright")}
      </p>
    </footer>
  );
}
