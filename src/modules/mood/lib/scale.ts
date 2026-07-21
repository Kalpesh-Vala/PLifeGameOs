export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodMeta = {
  value: MoodLevel;
  label: string;
  emoji: string;
  /** Tailwind text color class. */
  color: string;
};

export const MOODS: MoodMeta[] = [
  { value: 1, label: "Awful", emoji: "😞", color: "text-red-500" },
  { value: 2, label: "Bad", emoji: "😕", color: "text-orange-500" },
  { value: 3, label: "Okay", emoji: "😐", color: "text-yellow-500" },
  { value: 4, label: "Good", emoji: "🙂", color: "text-lime-500" },
  { value: 5, label: "Great", emoji: "😄", color: "text-green-500" },
];

export function getMood(value: number): MoodMeta | undefined {
  return MOODS.find((m) => m.value === value);
}
