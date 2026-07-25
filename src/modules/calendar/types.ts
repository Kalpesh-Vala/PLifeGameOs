export type CalendarDaySummary = {
  date: string;
  xp: number;
  tasksDue: number;
  events: number;
  hasJournal: boolean;
  mood: number | null;
};

export type CalendarMonth = {
  monthKey: string;
  days: CalendarDaySummary[];
};

export type DayDetail = {
  date: string;
  tasks: { id: string; title: string; status: string; priority: string }[];
  events: { id: string; time: string; title: string; category: string }[];
  journals: { id: string; title: string | null; content: string }[];
  mood: number | null;
};
