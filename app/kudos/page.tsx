import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KudosPageClient } from "@/components/kudos/kudos-page-client";

export default function KudosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <KudosPageClient />
      </main>
      <Footer />
    </div>
  );
}
