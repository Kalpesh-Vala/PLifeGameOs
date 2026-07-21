import { getProfileView, getRecentActivity } from "@/modules/gamification/service";
import { getTodayMood } from "@/modules/mood/service";
import { listTasks } from "@/modules/tasks/service";
import { listHabits } from "@/modules/habits/service";
import { retrieveMemories } from "@/modules/memory/service";
import { getMood } from "@/modules/mood/lib/scale";

/**
 * Assembles a compact, privacy-scoped snapshot of the user's Life OS data plus
 * the most relevant long-term memories, for grounding the AI assistant.
 */
export async function buildUserContext(
  userId: string,
  query: string,
): Promise<string> {
  const [profile, activity, mood, tasks, habits, memories] = await Promise.all([
    getProfileView(userId),
    getRecentActivity(userId, 8),
    getTodayMood(userId),
    listTasks(userId),
    listHabits(userId),
    retrieveMemories(userId, query, 6),
  ]);

  const todo = tasks.filter((t) => t.status === "todo");
  const topSkills = [...profile.skills]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 4)
    .map((s) => `${s.name} (Lv ${s.level})`)
    .join(", ");

  const habitsDone = habits.filter((h) => h.completedToday).length;
  const moodMeta = mood ? getMood(mood.mood) : undefined;

  const lines: string[] = [
    "## User snapshot",
    `- Level ${profile.level} (${profile.title}), ${profile.totalXp} total XP`,
    `- Current streak: ${profile.currentStreak} days (best ${profile.longestStreak})`,
    `- Checked in today: ${profile.checkedInToday ? "yes" : "no"}`,
    `- Top skills: ${topSkills || "none yet"}`,
    `- Tasks: ${todo.length} open, ${tasks.length - todo.length} completed`,
    `- Habits done today: ${habitsDone}/${habits.length}`,
    `- Today's mood: ${moodMeta ? `${moodMeta.label} ${moodMeta.emoji}` : "not logged"}`,
  ];

  if (todo.length > 0) {
    lines.push(
      `- Open tasks: ${todo.slice(0, 6).map((t) => t.title).join("; ")}`,
    );
  }

  if (activity.length > 0) {
    lines.push(
      `- Recent activity: ${activity
        .slice(0, 6)
        .map((a) => a.note ?? a.source)
        .join("; ")}`,
    );
  }

  if (memories.length > 0) {
    lines.push("", "## Relevant long-term memories");
    for (const m of memories) {
      lines.push(`- (${m.kind}) ${m.content}`);
    }
  }

  return lines.join("\n");
}
