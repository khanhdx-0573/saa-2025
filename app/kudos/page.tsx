import Image from "next/image";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { KudosBanner } from "@/components/kudos/board/kudos-banner";
import { KudosPageClient } from "@/components/kudos/board/kudos-page-client";

export default function KudosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* The key-visual background bleeds up behind the header itself (Header's
          own `bg-details-header-overlay` is semi-transparent, same trick as
          `app/login/page.tsx`'s hero) instead of starting only below it — this
          `relative` wrapper's height is driven by its normal-flow children
          (Header + KudosBanner's text slot). The image itself gets its OWN
          `aspect-[1440/512]` box pinned to `top-0` (fix-bug: an earlier `fill`
          here sized the image to the wrapper's FULL height — header + banner
          combined, taller than 1440:512 — so `object-cover` zoomed in and
          cropped the artwork). */}
      {/* fix-bug: `overflow-hidden` used to sit on this outer wrapper, which
         also contains the banner's search dropdown (absolutely positioned,
         opens below the input) — clipping it off whenever results extended
         past the key-visual's own height. The background image is the only
         thing that needs clipping, so `overflow-hidden` now lives on its own
         `aspect-[1440/512]` box instead, letting the dropdown overflow freely
         below it. */}
      <div className="relative w-full">
        <div className="absolute inset-x-0 top-0 aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[1440/512]">
          <Image src="/kudos/kv-background.png" alt="" fill priority className="object-cover" />
          {/* fix-bug: this left→right darkening is NOT baked into the raw
             asset (confirmed by sampling public/kudos/kv-background.png's
             own pixels directly — it's bright at x=100-400) — it's the
             "Cover" overlay from Figma's composite, empirically re-derived by
             sampling the rendered ground truth (momorph get_frame_image)
             pixel-by-pixel: near-opaque at the left edge, fading out but
             still ~15% opaque even near the right edge (fit: from-0%
             to-transparent to-[120%], i.e. the "fully transparent" stop
             falls just past the visible width). */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-details-background from-0% to-transparent to-[120%]" />
          {/* Bottom edge fade into the flat page background below. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-details-background from-0% to-transparent to-[13%]" />
        </div>
        <div className="relative z-10 flex flex-col">
          <Header />
          <KudosBanner />
        </div>
      </div>
      <main className="flex flex-1 flex-col">
        <KudosPageClient />
      </main>
      <Footer />
    </div>
  );
}
