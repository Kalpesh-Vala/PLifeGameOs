import type { QuestMetric, QuestPeriod } from "@/modules/quests/lib/definitions";

export type QuestView = {
  defId: string;
  title: string;
  metric: QuestMetric;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
};

export type QuestBoardView = {
  period: QuestPeriod;
  periodKey: string;
  quests: QuestView[];
};
