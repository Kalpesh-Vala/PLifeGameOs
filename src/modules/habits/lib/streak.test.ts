import { describe, it, expect } from "vitest";
import { computeStreaks } from "./streak";

describe("computeStreaks", () => {
  it("returns zero for no entries", () => {
    expect(computeStreaks([], "2026-01-10")).toEqual({ current: 0, longest: 0 });
  });

  it("counts a consecutive run ending today", () => {
    const entries = ["2026-01-08", "2026-01-09", "2026-01-10"];
    expect(computeStreaks(entries, "2026-01-10")).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("keeps the current streak alive if the last entry was yesterday", () => {
    const entries = ["2026-01-08", "2026-01-09"];
    expect(computeStreaks(entries, "2026-01-10").current).toBe(2);
  });

  it("breaks the current streak after a full missed day", () => {
    const entries = ["2026-01-05", "2026-01-06", "2026-01-07"];
    const res = computeStreaks(entries, "2026-01-10");
    expect(res.current).toBe(0);
    expect(res.longest).toBe(3);
  });

  it("ignores duplicate dates", () => {
    const entries = ["2026-01-09", "2026-01-09", "2026-01-10"];
    expect(computeStreaks(entries, "2026-01-10").current).toBe(2);
  });

  it("finds the longest historical run even if not current", () => {
    const entries = [
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-10",
    ];
    const res = computeStreaks(entries, "2026-01-10");
    expect(res.longest).toBe(4);
    expect(res.current).toBe(1);
  });
});
