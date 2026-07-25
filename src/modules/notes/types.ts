export type NoteView = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export const NOTE_XP = 10;
