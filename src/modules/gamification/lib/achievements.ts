/**
 * Achievement definitions and evaluation. The `check` predicates run on the
 * server against a stats snapshot; metadata is safe to render on the client.
 */

export type AchievementTier = "bronze" | "silver" | "gold" | "legendary";

/** Snapshot of a user's progress used to evaluate achievement criteria. */
export type AchievementContext = {
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  /** Map of skillId -> skill level. */
  skillLevels: Record<string, number>;
  /** Total number of daily check-ins recorded. */
  checkInCount: number;
};

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  /** Hidden achievements are not shown until unlocked. */
  secret?: boolean;
  check: (ctx: AchievementContext) => boolean;
};

function skillsAtLeast(
  ctx: AchievementContext,
  level: number,
  count: number,
): boolean {
  return (
    Object.values(ctx.skillLevels).filter((l) => l >= level).length >= count
  );
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Earn your very first XP.",
    icon: "Footprints",
    tier: "bronze",
    check: (c) => c.totalXp >= 1,
  },
  {
    id: "getting-started",
    name: "Getting Started",
    description: "Reach Level 5.",
    icon: "Sprout",
    tier: "bronze",
    check: (c) => c.level >= 5,
  },
  {
    id: "disciplined",
    name: "Disciplined",
    description: "Reach Level 10.",
    icon: "ShieldCheck",
    tier: "silver",
    check: (c) => c.level >= 10,
  },
  {
    id: "the-engineer",
    name: "The Engineer",
    description: "Reach Level 30.",
    icon: "Wrench",
    tier: "gold",
    check: (c) => c.level >= 30,
  },
  {
    id: "legend",
    name: "Legend",
    description: "Reach the maximum Level 100.",
    icon: "Crown",
    tier: "legendary",
    check: (c) => c.level >= 100,
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak.",
    icon: "Flame",
    tier: "silver",
    check: (c) => c.longestStreak >= 7,
  },
  {
    id: "monthly-master",
    name: "Monthly Master",
    description: "Maintain a 30-day streak.",
    icon: "CalendarCheck",
    tier: "gold",
    check: (c) => c.longestStreak >= 30,
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Maintain a 100-day streak.",
    icon: "Trophy",
    tier: "legendary",
    check: (c) => c.longestStreak >= 100,
  },
  {
    id: "xp-1k",
    name: "Grinder",
    description: "Earn 1,000 total XP.",
    icon: "Zap",
    tier: "silver",
    check: (c) => c.totalXp >= 1000,
  },
  {
    id: "xp-10k",
    name: "Powerhouse",
    description: "Earn 10,000 total XP.",
    icon: "Rocket",
    tier: "gold",
    check: (c) => c.totalXp >= 10000,
  },
  {
    id: "polymath",
    name: "Polymath",
    description: "Reach Level 3 in at least 3 skills.",
    icon: "Brain",
    tier: "gold",
    check: (c) => skillsAtLeast(c, 3, 3),
  },
  {
    id: "renaissance",
    name: "Renaissance",
    description: "Reach Level 5 in every skill.",
    icon: "Sparkles",
    tier: "legendary",
    check: (c) => skillsAtLeast(c, 5, 11),
  },
  {
    id: "consistent",
    name: "Consistency",
    description: "Complete 3 daily check-ins.",
    icon: "CheckCheck",
    tier: "bronze",
    check: (c) => c.checkInCount >= 3,
  },
];

export function getAchievement(
  id: string,
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Returns the ids of every achievement whose criteria are currently met. */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}
