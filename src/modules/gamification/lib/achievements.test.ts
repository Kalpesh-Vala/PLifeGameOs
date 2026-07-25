import { describe, it, expect } from "vitest";
import {
  evaluateAchievements,
  getAchievement,
  type AchievementContext,
} from "./achievements";

function ctx(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    level: 1,
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    skillLevels: {},
    checkInCount: 0,
    ...overrides,
  };
}

describe("evaluateAchievements", () => {
  it("unlocks nothing for a brand-new profile", () => {
    expect(evaluateAchievements(ctx())).toEqual([]);
  });

  it("unlocks First Steps on the first XP", () => {
    expect(evaluateAchievements(ctx({ totalXp: 1 }))).toContain("first-steps");
  });

  it("unlocks level milestones cumulatively", () => {
    const ids = evaluateAchievements(ctx({ level: 30, totalXp: 5000 }));
    expect(ids).toEqual(
      expect.arrayContaining([
        "getting-started",
        "disciplined",
        "the-engineer",
      ]),
    );
    expect(ids).not.toContain("legend");
  });

  it("unlocks streak achievements based on longest streak", () => {
    expect(evaluateAchievements(ctx({ longestStreak: 7 }))).toContain(
      "week-warrior",
    );
    expect(evaluateAchievements(ctx({ longestStreak: 30 }))).toContain(
      "monthly-master",
    );
    expect(evaluateAchievements(ctx({ longestStreak: 6 }))).not.toContain(
      "week-warrior",
    );
  });

  it("evaluates multi-skill achievements", () => {
    const polymath = ctx({ skillLevels: { a: 3, b: 3, c: 3 } });
    expect(evaluateAchievements(polymath)).toContain("polymath");

    const notYet = ctx({ skillLevels: { a: 3, b: 2, c: 3 } });
    expect(evaluateAchievements(notYet)).not.toContain("polymath");
  });

  it("unlocks the consistency achievement at 3 check-ins", () => {
    expect(evaluateAchievements(ctx({ checkInCount: 3 }))).toContain(
      "consistent",
    );
    expect(evaluateAchievements(ctx({ checkInCount: 2 }))).not.toContain(
      "consistent",
    );
  });
});

describe("getAchievement", () => {
  it("resolves a definition by id", () => {
    expect(getAchievement("legend")?.tier).toBe("legendary");
  });

  it("returns undefined for unknown ids", () => {
    expect(getAchievement("does-not-exist")).toBeUndefined();
  });
});
