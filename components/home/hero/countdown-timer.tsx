"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Ceremony date parsed from the "Thời gian: 26/12/2025" event-info text
 * (Figma node 2167:9057, Group 417). The Figma spec only carries a date,
 * no time-of-day, so 09:00 ICT is assumed as a plausible ceremony start —
 * flag for the orchestrator to confirm the real kickoff time.
 */
const TARGET_DATE = new Date("2025-12-26T09:00:00+07:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diffMs = Math.max(0, target.getTime() - Date.now());
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

function pad2(value: number): string {
  return Math.min(value, 99).toString().padStart(2, "0");
}

// Reusable glass digit box — covers all 6 design instances:
// mm:2167:9040 mm:I2167:9040;186:2616 mm:I2167:9040;186:2617
// mm:2167:9041 mm:I2167:9041;186:2616 mm:I2167:9041;186:2617
// mm:2167:9045 mm:I2167:9045;186:2616 mm:I2167:9045;186:2617
// mm:2167:9046 mm:I2167:9046;186:2616 mm:I2167:9046;186:2617
// mm:2167:9050 mm:I2167:9050;186:2616 mm:I2167:9050;186:2617
// mm:2167:9051 mm:I2167:9051;186:2616 mm:I2167:9051;186:2617
function DigitBox({ digit }: { digit: string }) {
  return (
    <div className="relative h-[82px] w-[51px] shrink-0 overflow-hidden rounded-lg">
      <div className="absolute inset-0 rounded-lg border-[0.5px] border-details-text-primary-1 bg-gradient-to-b from-details-text-secondary-1 to-white/10 opacity-50 backdrop-blur-[16.64px]" />
      {/*
        "Digital Numbers" (Figma fontFamily) is not available via next/font/google
        and lib/fonts.ts is out of scope for this task — falls back to a
        monospace stack so the build stays green. Flag for the orchestrator to
        self-host/add the real font if pixel-perfect digit typography is required.
      */}
      <span
        className="relative flex h-full items-center justify-center text-[49px] leading-none text-details-text-secondary-1"
        style={{ fontFamily: "'Digital Numbers', ui-monospace, SFMono-Regular, monospace" }}
      >
        {digit}
      </span>
    </div>
  );
}

// Reusable countdown column — covers all 3 design instances:
// mm:2167:9038 mm:2167:9039 mm:2167:9042 (Days)
// mm:2167:9043 mm:2167:9044 mm:2167:9047 (Hours)
// mm:2167:9048 mm:2167:9049 mm:2167:9052 (Minutes)
function CountdownUnit({ value, label }: { value: number; label: string }) {
  const [tens, ones] = pad2(value).split("");
  return (
    <div className="flex w-[116px] flex-col items-start justify-center gap-3.5">
      <div className="flex items-center justify-start gap-3.5">
        <DigitBox digit={tens} />
        <DigitBox digit={ones} />
      </div>
      <span className="font-montserrat text-2xl font-bold leading-8 text-details-text-secondary-1">
        {label}
      </span>
    </div>
  );
}

/**
 * Client-side ticking countdown toward the SAA 2025 ceremony date.
 * mm:2167:9037
 */
export function CountdownTimer() {
  const t = useTranslations("HomePage.hero.countdown");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(TARGET_DATE));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(getTimeLeft(TARGET_DATE));
    }, 30_000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-start gap-10">
      <CountdownUnit value={timeLeft.days} label={t("days")} />
      <CountdownUnit value={timeLeft.hours} label={t("hours")} />
      <CountdownUnit value={timeLeft.minutes} label={t("minutes")} />
    </div>
  );
}
