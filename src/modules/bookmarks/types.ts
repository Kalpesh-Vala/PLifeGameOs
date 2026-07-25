export type BookmarkView = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  tags: string[];
  createdAt: string;
};
