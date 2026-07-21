import type { TimelineCategory } from "@/modules/timeline/lib/categories";

export type TimelineEventView = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: TimelineCategory;
  note: string | null;
};

export const TIMELINE_XP = 5;
