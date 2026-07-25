import { describe, it, expect } from "vitest";
import {
  streakMultiplier,
  isScheduledOnDow,
  timeToMinutes,
  DIFFICULTY_DEFAULTS,
  PRIORITY_BONUS,
} from "./rules";

describe("streakMultiplier", () => {
  it("starts at 1x and grows every 7-day milestone", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(6)).toBe(1);
    expect(streakMultiplier(7)).toBe(1.5);
    expect(streakMultiplier(14)).toBe(2);
    expect(streakMultiplier(21)).toBe(2.5);
  });

  it("caps at 3x", () => {
    expect(streakMultiplier(28)).toBe(3);
    expect(streakMultiplier(1000)).toBe(3);
  });
});

describe("isScheduledOnDow", () => {
  it("daily habits are scheduled every day", () => {
    for (let dow = 0; dow < 7; dow++) {
      expect(isScheduledOnDow("daily", [], dow)).toBe(true);
    }
  });

  it("weekly habits are scheduled only on selected days", () => {
    expect(isScheduledOnDow("weekly", [1, 3, 5], 1)).toBe(true);
    expect(isScheduledOnDow("weekly", [1, 3, 5], 2)).toBe(false);
  });
});

describe("timeToMinutes", () => {
  it("parses HH:mm into minutes since midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("returns null for empty or malformed input", () => {
    expect(timeToMinutes(null)).toBeNull();
    expect(timeToMinutes("9:30")).toBeNull();
    expect(timeToMinutes("nonsense")).toBeNull();
  });
});

describe("reward tables", () => {
  it("harder habits award more XP and cost more penalty", () => {
    expect(DIFFICULTY_DEFAULTS.easy.xp).toBeLessThan(
      DIFFICULTY_DEFAULTS.hard.xp,
    );
    expect(DIFFICULTY_DEFAULTS.easy.penalty).toBeLessThan(
      DIFFICULTY_DEFAULTS.hard.penalty,
    );
  });

  it("priority bonus increases with priority", () => {
    expect(PRIORITY_BONUS.low).toBe(0);
    expect(PRIORITY_BONUS.medium).toBeLessThan(PRIORITY_BONUS.high);
  });
});
