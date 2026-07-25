import { connectToDatabase } from "@/server/db/mongoose";
import { dispatch } from "@/server/events/bus";
import { dateKey, yesterdayKey } from "@/lib/date";
import {
  getLevelProgress,
  levelFromXp,
} from "@/modules/gamification/lib/leveling";
import { SKILLS, getSkill } from "@/modules/gamification/lib/skills";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  getAchievement,
  type AchievementContext,
} from "@/modules/gamification/lib/achievements";
import { ProfileModel, XpEventModel } from "@/modules/gamification/models";
import type {
  ActivityItem,
  AchievementView,
  AwardResult,
  CheckInResult,
  ProfileView,
  SkillView,
  UnlockedAchievement,
} from "@/modules/gamification/types";

const CHECK_IN_BASE_XP = 25;
const COINS_PER_XP = 0.1;

type ProfileDocument = Awaited<ReturnType<typeof getOrCreateProfile>>;

/** Ensures a profile exists with every skill initialized. */
export async function getOrCreateProfile(userId: string) {
  await connectToDatabase();

  let profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    profile = await ProfileModel.create({
      userId,
      skills: SKILLS.map((s) => ({ skillId: s.id, xp: 0, level: 1 })),
    });
  }

  // Backfill any skills added after the profile was created.
  const existing = new Set(profile.skills.map((s) => s.skillId));
  const missing = SKILLS.filter((s) => !existing.has(s.id));
  if (missing.length) {
    profile.skills.push(
      ...missing.map((s) => ({ skillId: s.id, xp: 0, level: 1 })),
    );
    await profile.save();
  }

  return profile;
}

type ApplyXpResult = {
  leveledUp: boolean;
  fromLevel: number;
  toLevel: number;
  skillLevelUp: { skillId: string; from: number; to: number } | null;
};

/** Mutates a profile doc in memory to apply an XP grant. Does not save. */
function applyXp(
  profile: ProfileDocument,
  amount: number,
  skillId?: string,
): ApplyXpResult {
  const fromLevel = profile.level;
  profile.totalXp += amount;
  profile.coins += Math.floor(amount * COINS_PER_XP);
  const toLevel = levelFromXp(profile.totalXp);
  profile.level = toLevel;

  let skillLevelUp: ApplyXpResult["skillLevelUp"] = null;
  if (skillId && getSkill(skillId)) {
    const skill = profile.skills.find((s) => s.skillId === skillId);
    if (skill) {
      const skillFrom = skill.level;
      skill.xp += amount;
      skill.level = levelFromXp(skill.xp);
      if (skill.level > skillFrom) {
        skillLevelUp = { skillId, from: skillFrom, to: skill.level };
      }
    }
  }

  return {
    leveledUp: toLevel > fromLevel,
    fromLevel,
    toLevel,
    skillLevelUp,
  };
}

/** Unlocks any newly-earned achievements on the profile. Does not save. */
function syncAchievements(profile: ProfileDocument): UnlockedAchievement[] {
  const skillLevels: Record<string, number> = {};
  for (const s of profile.skills) skillLevels[s.skillId] = s.level;

  const ctx: AchievementContext = {
    level: profile.level,
    totalXp: profile.totalXp,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    skillLevels,
    checkInCount: profile.checkInCount,
  };

  const earned = new Set(evaluateAchievements(ctx));
  const already = new Set(profile.achievements.map((a) => a.achievementId));

  const newlyUnlocked: UnlockedAchievement[] = [];
  for (const id of earned) {
    if (already.has(id)) continue;
    const def = getAchievement(id);
    if (!def) continue;
    profile.achievements.push({ achievementId: id, unlockedAt: new Date() });
    newlyUnlocked.push({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      tier: def.tier,
    });
  }

  return newlyUnlocked;
}

async function emitAwardEvents(
  userId: string,
  amount: number,
  source: string,
  skillId: string | undefined,
  totalXp: number,
  applied: ApplyXpResult,
  unlocked: UnlockedAchievement[],
): Promise<void> {
  await dispatch("xp.awarded", { userId, amount, source, skillId, totalXp });
  if (applied.leveledUp) {
    await dispatch("level.up", {
      userId,
      from: applied.fromLevel,
      to: applied.toLevel,
    });
  }
  if (applied.skillLevelUp) {
    await dispatch("skill.level.up", { userId, ...applied.skillLevelUp });
  }
  for (const a of unlocked) {
    await dispatch("achievement.unlocked", { userId, achievementId: a.id });
  }
}

export type AwardXpInput = {
  amount: number;
  source: string;
  skillId?: string;
  note?: string;
};

/**
 * Core XP grant. Updates the character + skill, unlocks achievements, writes
 * the ledger entry, and emits domain events.
 */
export async function awardXp(
  userId: string,
  input: AwardXpInput,
): Promise<AwardResult> {
  const profile = await getOrCreateProfile(userId);
  const applied = applyXp(profile, input.amount, input.skillId);
  const unlocked = syncAchievements(profile);
  await profile.save();

  await XpEventModel.create({
    userId,
    amount: input.amount,
    source: input.source,
    skillId: input.skillId ?? null,
    note: input.note ?? null,
  });

  await emitAwardEvents(
    userId,
    input.amount,
    input.source,
    input.skillId,
    profile.totalXp,
    applied,
    unlocked,
  );

  return {
    amount: input.amount,
    totalXp: profile.totalXp,
    level: profile.level,
    leveledUp: applied.leveledUp,
    fromLevel: applied.fromLevel,
    skillLevelUp: applied.skillLevelUp,
    unlockedAchievements: unlocked,
  };
}

export type PenaltyInput = {
  xp?: number;
  coins?: number;
  disciplineDelta?: number;
  source: string;
  note?: string;
};

export type PenaltyResult = {
  xpLost: number;
  coinsLost: number;
  totalXp: number;
  level: number;
  leveledDown: boolean;
  disciplineScore: number;
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Applies a penalty: subtracts XP/coins (floored at 0), recomputes level (which
 * can drop — a real consequence), and adjusts the discipline score. Penalties
 * are recorded as negative ledger entries but do NOT emit xp.awarded events (so
 * quests that count earned XP aren't affected).
 */
export async function applyPenalty(
  userId: string,
  input: PenaltyInput,
): Promise<PenaltyResult> {
  const profile = await getOrCreateProfile(userId);
  const fromLevel = profile.level;
  const xp = Math.max(0, input.xp ?? 0);
  const coins = Math.max(0, input.coins ?? 0);

  profile.totalXp = Math.max(0, profile.totalXp - xp);
  profile.coins = Math.max(0, profile.coins - coins);
  profile.level = levelFromXp(profile.totalXp);
  profile.disciplineScore = clampScore(
    profile.disciplineScore + (input.disciplineDelta ?? 0),
  );
  await profile.save();

  if (xp > 0 || coins > 0) {
    await XpEventModel.create({
      userId,
      amount: -xp,
      source: input.source,
      skillId: null,
      note: input.note ?? null,
    });
  }

  return {
    xpLost: xp,
    coinsLost: coins,
    totalXp: profile.totalXp,
    level: profile.level,
    leveledDown: profile.level < fromLevel,
    disciplineScore: profile.disciplineScore,
  };
}

/** Adjusts the discipline score by a delta (clamped 0-100). Returns new value. */
export async function adjustDiscipline(
  userId: string,
  delta: number,
): Promise<number> {
  const profile = await getOrCreateProfile(userId);
  profile.disciplineScore = clampScore(profile.disciplineScore + delta);
  await profile.save();
  return profile.disciplineScore;
}

/**
 * Records a daily check-in: advances or resets the streak and grants XP with a
 * streak bonus. Idempotent per day.
 */
export async function checkIn(userId: string): Promise<CheckInResult> {
  const profile = await getOrCreateProfile(userId);
  const today = dateKey();

  if (profile.lastCheckIn === today) {
    return {
      alreadyCheckedIn: true,
      amount: 0,
      totalXp: profile.totalXp,
      level: profile.level,
      leveledUp: false,
      fromLevel: profile.level,
      skillLevelUp: null,
      unlockedAchievements: [],
      currentStreak: profile.currentStreak,
    };
  }

  const continued = profile.lastCheckIn === yesterdayKey();
  const newStreak = continued ? profile.currentStreak + 1 : 1;

  profile.currentStreak = newStreak;
  profile.longestStreak = Math.max(profile.longestStreak, newStreak);
  profile.lastCheckIn = today;
  profile.checkInCount += 1;

  const streakBonus = Math.min(newStreak, 10) * 5;
  const amount = CHECK_IN_BASE_XP + streakBonus;

  const applied = applyXp(profile, amount);
  const unlocked = syncAchievements(profile);
  await profile.save();

  await XpEventModel.create({
    userId,
    amount,
    source: "check-in",
    skillId: null,
    note: `Daily check-in (day ${newStreak})`,
  });

  await dispatch("user.checkedIn", { userId, streak: newStreak });
  await emitAwardEvents(
    userId,
    amount,
    "check-in",
    undefined,
    profile.totalXp,
    applied,
    unlocked,
  );

  return {
    alreadyCheckedIn: false,
    amount,
    totalXp: profile.totalXp,
    level: profile.level,
    leveledUp: applied.leveledUp,
    fromLevel: applied.fromLevel,
    skillLevelUp: applied.skillLevelUp,
    unlockedAchievements: unlocked,
    currentStreak: newStreak,
  };
}

function toSkillView(skillId: string, xp: number): SkillView {
  const def = getSkill(skillId)!;
  const progress = getLevelProgress(xp);
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    icon: def.icon,
    level: progress.level,
    xp,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    progressPct: progress.progressPct,
  };
}

/** Client-facing profile snapshot. */
export async function getProfileView(userId: string): Promise<ProfileView> {
  const profile = await getOrCreateProfile(userId);
  const progress = getLevelProgress(profile.totalXp);

  const skills = SKILLS.map((def) => {
    const entry = profile.skills.find((s) => s.skillId === def.id);
    return toSkillView(def.id, entry?.xp ?? 0);
  });

  return {
    level: progress.level,
    title: progress.title,
    totalXp: progress.totalXp,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    progressPct: progress.progressPct,
    isMaxLevel: progress.isMaxLevel,
    coins: profile.coins,
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    disciplineScore: profile.disciplineScore,
    lastCheckIn: profile.lastCheckIn ?? null,
    checkedInToday: profile.lastCheckIn === dateKey(),
    checkInCount: profile.checkInCount,
    achievementsUnlocked: profile.achievements.length,
    achievementsTotal: ACHIEVEMENTS.length,
    skills,
  };
}

/** All achievements with unlock state for the current user. */
export async function getAchievementsView(
  userId: string,
): Promise<AchievementView[]> {
  const profile = await getOrCreateProfile(userId);
  const unlockedMap = new Map(
    profile.achievements.map((a) => [a.achievementId, a.unlockedAt]),
  );

  return ACHIEVEMENTS.map((def) => {
    const unlockedAt = unlockedMap.get(def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      tier: def.tier,
      unlocked: Boolean(unlockedAt),
      unlockedAt: unlockedAt ? new Date(unlockedAt).toISOString() : null,
      secret: Boolean(def.secret),
    };
  });
}

/** Recent XP ledger entries, newest first. */
export async function getRecentActivity(
  userId: string,
  limit = 15,
): Promise<ActivityItem[]> {
  await connectToDatabase();
  const events = await XpEventModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return events.map((e) => ({
    id: String(e._id),
    amount: e.amount,
    source: e.source,
    skillId: e.skillId ?? null,
    note: e.note ?? null,
    createdAt: new Date(e.createdAt as Date).toISOString(),
  }));
}
