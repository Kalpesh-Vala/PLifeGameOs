export type TimelineCategory =
  | "work"
  | "learning"
  | "fitness"
  | "health"
  | "personal"
  | "social"
  | "meal"
  | "rest"
  | "other";

export type TimelineCategoryMeta = {
  id: TimelineCategory;
  label: string;
  icon: string;
  color: string; // Tailwind text color class
};

export const TIMELINE_CATEGORIES: TimelineCategoryMeta[] = [
  { id: "work", label: "Work", icon: "Briefcase", color: "text-blue-500" },
  { id: "learning", label: "Learning", icon: "BookOpen", color: "text-violet-500" },
  { id: "fitness", label: "Fitness", icon: "Dumbbell", color: "text-emerald-500" },
  { id: "health", label: "Health", icon: "HeartPulse", color: "text-rose-500" },
  { id: "personal", label: "Personal", icon: "User", color: "text-amber-500" },
  { id: "social", label: "Social", icon: "Users", color: "text-pink-500" },
  { id: "meal", label: "Meal", icon: "Utensils", color: "text-orange-500" },
  { id: "rest", label: "Rest", icon: "Moon", color: "text-indigo-500" },
  { id: "other", label: "Other", icon: "Circle", color: "text-muted-foreground" },
];

export const TIMELINE_CATEGORY_IDS = TIMELINE_CATEGORIES.map((c) => c.id);

export function getTimelineCategory(
  id: string,
): TimelineCategoryMeta | undefined {
  return TIMELINE_CATEGORIES.find((c) => c.id === id);
}
