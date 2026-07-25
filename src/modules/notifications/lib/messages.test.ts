import { describe, it, expect } from "vitest";
import {
  buildHabitMessage,
  buildTasksDueMessage,
  buildTasksOverdueMessage,
} from "./messages";
import type { NotificationStage } from "./schedule";

const STAGES: NotificationStage[] = ["heads-up", "due", "grace", "final-call"];

describe("buildHabitMessage", () => {
  it("produces a title and body for every stage", () => {
    for (const stage of STAGES) {
      const msg = buildHabitMessage(
        stage,
        { title: "Morning Run", streak: 0, minutesLeft: 8 },
        () => 0,
      );
      expect(msg.title.length).toBeGreaterThan(0);
      expect(msg.body).toContain("Morning Run");
    }
  });

  it("includes an emoji in the title", () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const stage of STAGES) {
      const msg = buildHabitMessage(
        stage,
        { title: "Read", streak: 1, minutesLeft: 3 },
        () => 0,
      );
      expect(emoji.test(msg.title)).toBe(true);
    }
  });

  it("uses streak-aware copy when the streak is meaningful", () => {
    const withStreak = buildHabitMessage(
      "final-call",
      { title: "Meditate", streak: 12, minutesLeft: 4 },
      () => 0,
    );
    expect(withStreak.body).toContain("12");
  });

  it("is deterministic given a fixed random source", () => {
    const ctx = { title: "Journal", streak: 5, minutesLeft: 2 };
    const a = buildHabitMessage("due", ctx, () => 0.42);
    const b = buildHabitMessage("due", ctx, () => 0.42);
    expect(a).toEqual(b);
  });
});

describe("task summary messages", () => {
  it("uses singular vs plural correctly for due tasks", () => {
    expect(buildTasksDueMessage(1).body).toContain("1 task");
    expect(buildTasksDueMessage(3).body).toContain("3 tasks");
  });

  it("uses singular vs plural correctly for overdue tasks", () => {
    expect(buildTasksOverdueMessage(1).body).toContain("1 task");
    expect(buildTasksOverdueMessage(5).body).toContain("5 tasks");
  });
});
