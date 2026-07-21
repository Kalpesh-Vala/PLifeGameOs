"use client";

import * as React from "react";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import { dateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * GitHub-style contribution heatmap. Renders the last `weeks` weeks as columns
 * of 7 day-cells. `entries` is a set of active date keys (YYYY-MM-DD). When
 * `counts` is provided, cell intensity scales with the value.
 */
export function ContributionHeatmap({
  entries,
  counts,
  weeks = 26,
  className,
}: {
  entries?: string[];
  counts?: Record<string, number>;
  weeks?: number;
  className?: string;
}) {
  const { columns, max } = React.useMemo(() => {
    const active = new Set(entries ?? Object.keys(counts ?? {}));
    const today = new Date();
    const start = startOfWeek(subDays(today, (weeks - 1) * 7), {
      weekStartsOn: 0,
    });

    let maxCount = 1;
    const cols: { key: string; count: number; future: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: { key: string; count: number; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = dateKey(date);
        const count = counts ? (counts[key] ?? 0) : active.has(key) ? 1 : 0;
        if (count > maxCount) maxCount = count;
        col.push({ key, count, future: date > today });
      }
      cols.push(col);
    }
    return { columns: cols, max: maxCount };
  }, [entries, counts, weeks]);

  const intensity = (count: number): string => {
    if (count <= 0) return "bg-muted";
    const ratio = count / max;
    if (ratio > 0.66) return "bg-xp";
    if (ratio > 0.33) return "bg-xp/70";
    return "bg-xp/40";
  };

  return (
    <div className={cn("flex gap-[3px] overflow-x-auto", className)}>
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {col.map((cell) => (
            <div
              key={cell.key}
              title={`${format(new Date(cell.key), "MMM d, yyyy")}${
                cell.count > 0 ? ` · ${cell.count}` : ""
              }`}
              className={cn(
                "size-[11px] rounded-[2px]",
                cell.future ? "bg-transparent" : intensity(cell.count),
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
