import Image from "next/image";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export default function LoginPage() {
  const t = useTranslations("LoginPage");

  return (
    <div className="relative flex min-h-screen flex-col bg-details-background">
      <Image
        src="/login/hero-background.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-details-background from-[22%] to-[52%] to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-details-background via-details-background via-[25%] to-transparent" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex flex-1 flex-col items-start justify-center gap-16 px-6 py-16 lg:px-36 lg:py-24">
          <div className="flex flex-col items-start gap-20">
            <Image
              src="/login/root-further-wordmark.png"
              alt="Root Further"
              width={451}
              height={200}
              className="h-auto w-[240px] object-contain lg:w-[451px]"
            />

            <div className="flex flex-col items-start gap-6 pl-0 lg:pl-4">
              <p className="max-w-[480px] font-montserrat text-lg leading-10 font-bold tracking-[0.5px] text-details-text-secondary-1 lg:text-xl">
                <span className="block">{t("headlineLine1")}</span>
                <span className="block">{t("headlineLine2")}</span>
              </p>
              <GoogleLoginButton />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
