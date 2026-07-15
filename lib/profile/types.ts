import type { Profile, KudosStats } from "@/lib/kudos/types";

export type ProfileDetail = Profile & {
  starRating: 0 | 1 | 2 | 3;
  stats: KudosStats;
};
