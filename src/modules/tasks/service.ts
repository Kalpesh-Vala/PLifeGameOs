import { connectToDatabase } from "@/server/db/mongoose";
import { dispatch } from "@/server/events/bus";
import { getSkill } from "@/modules/gamification/lib/skills";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { TaskModel, type TaskDoc } from "@/modules/tasks/models";
import { TASK_XP, type TaskView } from "@/modules/tasks/types";
import type { HydratedDocument } from "mongoose";

function toView(task: HydratedDocument<TaskDoc>): TaskView {
  const skill = task.skillId ? getSkill(task.skillId) : undefined;
  return {
    id: String(task._id),
    title: task.title,
    notes: task.notes ?? null,
    priority: task.priority as TaskView["priority"],
    status: task.status as TaskView["status"],
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    skillId: task.skillId ?? null,
    skillName: skill?.name ?? null,
    xpReward: TASK_XP[task.priority as keyof typeof TASK_XP],
    completedAt: task.completedAt
      ? new Date(task.completedAt).toISOString()
      : null,
    createdAt: new Date(task.createdAt as Date).toISOString(),
  };
}

export type CreateTaskInput = {
  title: string;
  notes?: string;
  priority?: TaskView["priority"];
  dueDate?: Date | null;
  skillId?: string | null;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export async function listTasks(userId: string): Promise<TaskView[]> {
  await connectToDatabase();
  const tasks = await TaskModel.find({ userId })
    .sort({ status: 1, createdAt: -1 })
    .limit(500);
  return tasks.map(toView);
}

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<TaskView> {
  await connectToDatabase();
  const task = await TaskModel.create({
    userId,
    title: input.title,
    notes: input.notes ?? null,
    priority: input.priority ?? "medium",
    dueDate: input.dueDate ?? null,
    skillId: input.skillId ?? null,
  });
  return toView(task);
}

export async function updateTask(
  userId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<TaskView | null> {
  await connectToDatabase();
  const task = await TaskModel.findOne({ _id: id, userId });
  if (!task) return null;

  if (input.title !== undefined) task.title = input.title;
  if (input.notes !== undefined) task.notes = input.notes;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  if (input.skillId !== undefined) task.skillId = input.skillId;

  await task.save();
  return toView(task);
}

export type CompleteTaskResult = {
  task: TaskView;
  award: AwardResult | null;
};

export async function completeTask(
  userId: string,
  id: string,
): Promise<CompleteTaskResult | null> {
  await connectToDatabase();
  const task = await TaskModel.findOne({ _id: id, userId });
  if (!task) return null;

  const alreadyRewarded = task.xpAwarded;
  task.status = "done";
  task.completedAt = new Date();

  let award: AwardResult | null = null;
  if (!alreadyRewarded) {
    task.xpAwarded = true;
    await task.save();

    const xp = TASK_XP[task.priority as keyof typeof TASK_XP];
    award = await awardXp(userId, {
      amount: xp,
      source: "task",
      skillId: task.skillId ?? undefined,
      note: `Completed task: ${task.title}`,
    });
    await dispatch("task.completed", {
      userId,
      taskId: String(task._id),
      skillId: task.skillId ?? undefined,
      xp,
    });
  } else {
    await task.save();
  }

  return { task: toView(task), award };
}

export async function reopenTask(
  userId: string,
  id: string,
): Promise<TaskView | null> {
  await connectToDatabase();
  const task = await TaskModel.findOne({ _id: id, userId });
  if (!task) return null;
  task.status = "todo";
  task.completedAt = null;
  await task.save();
  return toView(task);
}

export async function deleteTask(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await TaskModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
