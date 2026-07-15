import { GiftRecipientsList } from "@/components/kudos/board/gift-recipients-list";
import { SecretBoxBlock } from "@/components/kudos/board/secret-box-block";
import { SidebarStats } from "@/components/kudos/board/sidebar-stats";
import type { KudosStats } from "@/lib/kudos/types";

// Right sidebar: real stats card (D.1) holding the mock Secret Box, plus the
// mock gift-recipients card (D.3). This wrapper must stay a plain unbounded
// flex column — a shared scroll here fights GiftRecipientsList's own internal scroll.
type KudosSidebarProps = {
  stats: KudosStats;
};

export function KudosSidebar({ stats }: KudosSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-2.5 rounded-[17px] border border-details-border bg-details-container-2 p-6">
        <SidebarStats stats={stats} />
        <div className="h-px w-full bg-details-divider" />
        <SecretBoxBlock />
      </div>
      <GiftRecipientsList />
    </aside>
  );
}
