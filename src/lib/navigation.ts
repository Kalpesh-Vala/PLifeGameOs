import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  Repeat,
  Swords,
  Target,
  CalendarDays,
  NotebookPen,
  Smile,
  Clock,
  Dumbbell,
  Wallet,
  Brain,
  Code2,
  GraduationCap,
  Map,
  FolderKanban,
  BookOpen,
  StickyNote,
  Library,
  Bookmark,
  BarChart3,
  Trophy,
  Sparkles,
  Database,
  Image,
  Medal,
  Settings,
} from "lucide-react";

export type NavItem = {
  title: string;
  slug: string;
  href: string;
  icon: LucideIcon;
  /** Marks modules that are planned but not yet implemented. */
  soon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const item = (
  title: string,
  slug: string,
  icon: LucideIcon,
  soon = true,
): NavItem => ({
  title,
  slug,
  href: slug === "dashboard" ? "/dashboard" : `/${slug}`,
  icon,
  soon,
});

export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      item("Dashboard", "dashboard", LayoutDashboard, false),
      item("Analytics", "analytics", BarChart3, false),
      item("Achievements", "achievements", Trophy, false),
      item("Leaderboard", "leaderboard", Medal),
    ],
  },
  {
    label: "Plan",
    items: [
      item("Tasks", "tasks", ListChecks, false),
      item("Habits", "habits", Repeat, false),
      item("Daily Quests", "quests", Swords, false),
      item("Goals", "goals", Target, false),
      item("Calendar", "calendar", CalendarDays),
    ],
  },
  {
    label: "Growth",
    items: [
      item("Skill Tree", "skills", Brain, false),
      item("Interview Prep", "interview", GraduationCap, false),
      item("Coding Tracker", "coding", Code2, false),
      item("Learning", "learning", BookOpen),
      item("Roadmaps", "roadmaps", Map),
      item("Projects", "projects", FolderKanban, false),
      item("Reading", "reading", Library),
    ],
  },
  {
    label: "Wellbeing",
    items: [
      item("Fitness", "fitness", Dumbbell, false),
      item("Journal", "journal", NotebookPen, false),
      item("Mood", "mood", Smile, false),
      item("Timeline", "timeline", Clock, false),
    ],
  },
  {
    label: "Knowledge",
    items: [
      item("Notes", "notes", StickyNote),
      item("Knowledge Base", "knowledge", Library),
      item("Bookmarks", "bookmarks", Bookmark),
      item("Vision Board", "vision", Image),
    ],
  },
  {
    label: "Money",
    items: [item("Finance", "finance", Wallet, false)],
  },
  {
    label: "AI",
    items: [
      item("AI Assistant", "ai", Sparkles, false),
      item("AI Memory", "memory", Database, false),
    ],
  },
];

export const bottomNav: NavItem[] = [
  item("Settings", "settings", Settings),
];

export const allNavItems: NavItem[] = [
  ...navigation.flatMap((g) => g.items),
  ...bottomNav,
];
