import { describe, it, expect } from "vitest";
import {
  stageForMinutes,
  computeHabitStage,
  HEADS_UP_MIN,
} from "./schedule";

// Habit scheduled at 09:00 (540 min) with 60 min grace -> deadline 10:00 (600).
const S = 540;
const G = 60;

describe("stageForMinutes", () => {
  it("returns null well before the heads-up window", () => {
    expect(stageForMinutes(S, G, S - HEADS_UP_MIN - 1)).toBeNull();
  });

  it("returns heads-up just before the scheduled time", () => {
    expect(stageForMinutes(S, G, S - HEADS_UP_MIN)).toBe("heads-up");
    expect(stageForMinutes(S, G, S - 1)).toBe("heads-up");
  });

  it("returns due at and shortly after the scheduled time", () => {
    expect(stageForMinutes(S, G, S)).toBe("due");
    expect(stageForMinutes(S, G, S + 10)).toBe("due");
  });

  it("returns grace past the halfway point of the grace period", () => {
    // graceStart = 540 + 30 = 570
    expect(stageForMinutes(S, G, 570)).toBe("grace");
    expect(stageForMinutes(S, G, 590)).toBe("grace");
  });

  it("returns final-call in the last stretch before the deadline", () => {
    // finalStart = 600 - min(5, ceil(60/3)=20) = 595
    expect(stageForMinutes(S, G, 595)).toBe("final-call");
    expect(stageForMinutes(S, G, 599)).toBe("final-call");
  });

  it("returns null once the deadline has passed (missed)", () => {
    expect(stageForMinutes(S, G, 600)).toBeNull();
    expect(stageForMinutes(S, G, 700)).toBeNull();
  });

  it("handles a zero grace period with a short due window", () => {
    expect(stageForMinutes(S, 0, S)).toBe("due");
    expect(stageForMinutes(S, 0, S + 4)).toBe("due");
    expect(stageForMinutes(S, 0, S + 5)).toBeNull();
  });

  it("progresses through stages in order without skipping backward", () => {
    const seen: string[] = [];
    let last: string | null = null;
    for (let m = S - HEADS_UP_MIN; m < S + G; m++) {
      const stage = stageForMinutes(S, G, m);
      if (stage && stage !== last) {
        seen.push(stage);
        last = stage;
      }
    }
    expect(seen).toEqual(["heads-up", "due", "grace", "final-call"]);
  });
});

describe("computeHabitStage", () => {
  it("returns null for habits with no scheduled time", () => {
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    expect(
      computeHabitStage({ scheduledTime: null, gracePeriodMin: 30 }, now),
    ).toBeNull();
  });

  it("computes stage and minutes left from a real clock time", () => {
    const now = new Date();
    now.setHours(9, 30, 0, 0); // 30 min into a 60-min grace -> grace stage
    const res = computeHabitStage(
      { scheduledTime: "09:00", gracePeriodMin: 60 },
      now,
    );
    expect(res?.stage).toBe("grace");
    expect(res?.minutesLeft).toBe(30);
  });
});
