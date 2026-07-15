"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PersonIcon } from "@/components/kudos/kudos-icons";

// "10 Sunner nhận quà" list (Figma D.3): mock, display-only — the gift feature
// doesn't exist yet. Only the avatar/name navigation to a profile is real.
type GiftRecipient = {
  id: string;
  name: string;
  prize: string;
};

// Prize copy is mock, but each `id` must be a real profile so the avatar/name
// navigation actually resolves.
const MOCK_GIFT_RECIPIENTS: GiftRecipient[] = [
  { id: "e6f12d2e-f3da-46a1-b93c-4809748a1be3", name: "Huỳnh Dương Xuân", prize: "Nhận được 1 áo phông SAA" },
  { id: "13d9355c-004b-46bd-bc6d-bc39e5f4626c", name: "Đỗ Hoàng Hiệp", prize: "Nhận được 1 balo Sun*" },
  { id: "1004d5e5-2f89-4618-a674-736330091d6d", name: "Dương Thúy An", prize: "Nhận được 1 voucher 500K" },
  { id: "03a6ff6f-bcb8-4482-af64-d1cb9769e93c", name: "Mai Phương Thúy", prize: "Nhận được 1 tai nghe Bluetooth" },
  { id: "13d9355c-004b-46bd-bc6d-bc39e5f4626c", name: "Nguyễn Văn Quy", prize: "Nhận được 1 bình giữ nhiệt Sun*" },
  { id: "1004d5e5-2f89-4618-a674-736330091d6d", name: "Lê Kiều Trang", prize: "Nhận được 1 phiếu quà tặng" },
];

function GiftRecipientRow({ recipient }: { recipient: GiftRecipient }) {
  return (
    <Link
      href={`/profile/${recipient.id}`}
      className="flex h-16 w-full items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.87px] border-details-text-secondary-1 bg-details-background text-details-text-secondary-1">
        <PersonIcon />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-montserrat text-[22px] font-bold leading-7 text-details-text-primary-1">
          {recipient.name}
        </span>
        <span className="font-montserrat text-base font-bold leading-6 tracking-[0.15px] text-details-text-secondary-1">
          {recipient.prize}
        </span>
      </span>
    </Link>
  );
}

export function GiftRecipientsList() {
  const t = useTranslations("KudosLiveBoard");

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[17px] border border-details-border bg-details-container-2 py-6 pl-6 pr-4">
      <h2 className="w-full text-center font-montserrat text-[22px] font-bold leading-7 text-details-text-primary-1">
        {t("sidebar.giftListTitle")}
      </h2>
      {MOCK_GIFT_RECIPIENTS.length === 0 ? (
        <p className="w-full py-4 text-center font-montserrat text-base text-details-text-secondary-2">
          {t("sidebar.giftListEmpty")}
        </p>
      ) : (
        <div className="scrollbar-thin flex max-h-[400px] w-full flex-col gap-4 overflow-y-auto pr-2.5">
          {MOCK_GIFT_RECIPIENTS.map((recipient, index) => (
            <GiftRecipientRow key={`${recipient.id}-${index}`} recipient={recipient} />
          ))}
        </div>
      )}
    </div>
  );
}
