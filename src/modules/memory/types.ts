export type MemoryKind =
  | "fact"
  | "event"
  | "insight"
  | "journal"
  | "review"
  | "preference";

export type MemoryView = {
  id: string;
  kind: MemoryKind;
  content: string;
  importance: number;
  source: string;
  createdAt: string;
};

export type RetrievedMemory = MemoryView & { score: number };
