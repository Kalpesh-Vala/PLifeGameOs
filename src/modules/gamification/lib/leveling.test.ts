import { describe, it, expect } from "vitest";
import {
  MAX_LEVEL,
  xpForLevelUp,
  totalXpForLevel,
  levelFromXp,
  getLevelProgress,
  levelTitle,
} from "./leveling";

describe("xpForLevelUp", () => {
  it("scales linearly with level (100 * L)", () => {
    expect(xpForLevelUp(1)).toBe(100);
    expect(xpForLevelUp(2)).toBe(200);
    expect(xpForLevelUp(3)).toBe(300);
  });

  it("treats levels below 1 as level 1", () => {
    expect(xpForLevelUp(0)).toBe(100);
    expect(xpForLevelUp(-5)).toBe(100);
  });
});

describe("totalXpForLevel", () => {
  it("is the cumulative sum of the curve (50 * L * (L-1))", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(300);
    expect(totalXpForLevel(4)).toBe(600);
  });
});

describe("levelFromXp", () => {
  it("maps XP thresholds to the correct level", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(300)).toBe(3);
  });

  it("never goes below 1 or above MAX_LEVEL", () => {
    expect(levelFromXp(-100)).toBe(1);
    expect(levelFromXp(Number.MAX_SAFE_INTEGER)).toBe(MAX_LEVEL);
  });

  it("is the inverse of totalXpForLevel at boundaries", () => {
    for (let l = 1; l <= 20; l++) {
      expect(levelFromXp(totalXpForLevel(l))).toBe(l);
      expect(levelFromXp(totalXpForLevel(l + 1) - 1)).toBe(l);
    }
  });
});

describe("getLevelProgress", () => {
  it("reports progress within the current level", () => {
    // 150 XP -> level 2 (threshold 100), 50 into a 200-wide level.
    const p = getLevelProgress(150);
    expect(p.level).toBe(2);
    expect(p.xpIntoLevel).toBe(50);
    expect(p.xpForNextLevel).toBe(200);
    expect(p.progressPct).toBe(25);
    expect(p.isMaxLevel).toBe(false);
  });

  it("caps at max level with full progress", () => {
    const p = getLevelProgress(totalXpForLevel(MAX_LEVEL) + 10_000);
    expect(p.level).toBe(MAX_LEVEL);
    expect(p.isMaxLevel).toBe(true);
    expect(p.progressPct).toBe(100);
  });
});

describe("levelTitle", () => {
  it("returns rank titles by threshold", () => {
    expect(levelTitle(1)).toBe("Beginner");
    expect(levelTitle(5)).toBe("Novice");
    expect(levelTitle(10)).toBe("Disciplined");
    expect(levelTitle(100)).toBe("Legend");
  });
});
