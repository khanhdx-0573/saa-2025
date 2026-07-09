import Image from "next/image";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function Header() {
  return (
    <header className="flex w-full items-center justify-between bg-details-header-overlay px-6 py-3 lg:px-36">
      <Image src="/login/sun-logo.png" alt="Sun* Annual Awards" width={52} height={48} className="h-12 w-[52px] object-cover" />
      <LanguageSwitcher />
    </header>
  );
}
