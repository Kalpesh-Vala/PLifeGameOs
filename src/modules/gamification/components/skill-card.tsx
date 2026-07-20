import { DynamicIcon } from "@/components/dynamic-icon";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SkillView } from "@/modules/gamification/types";

export function SkillCard({ skill }: { skill: SkillView }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
          <DynamicIcon name={skill.icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{skill.name}</p>
          <p className="text-xs text-muted-foreground">{skill.category}</p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold">
          Lv {skill.level}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <Progress value={skill.progressPct} className="h-1.5" />
        <p className="text-right text-[11px] text-muted-foreground">
          {skill.xpIntoLevel} / {skill.xpForNextLevel} XP
        </p>
      </div>
    </div>
  );
}

export function SkillGrid({
  skills,
  className,
}: {
  skills: SkillView[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
