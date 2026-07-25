export type BookStatus = "want" | "reading" | "finished";

export type BookView = {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  totalPages: number | null;
  currentPage: number;
  rating: number | null;
  finishedAt: string | null;
  createdAt: string;
};

export const READING_XP = 50;
