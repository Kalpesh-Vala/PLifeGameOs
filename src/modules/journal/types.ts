export type JournalEntryView = {
  id: string;
  date: string;
  title: string | null;
  content: string;
  mood: number | null;
  tags: string[];
  createdAt: string;
};

export const JOURNAL_XP = 20;
