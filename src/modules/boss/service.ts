import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { getSkill } from "@/modules/gamification/lib/skills";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { BossBattleModel, type BossBattleDoc } from "@/modules/boss/models";
import { bossXpReward, type BossBattleView } from "@/modules/boss/types";

function toView(battle: HydratedDocument<BossBattleDoc>): BossBattleView {
  const total = battle.milestones.length;
  const done = battle.milestones.filter((m) => m.done).length;
  const skill = battle.skillId ? getSkill(battle.skillId) : undefined;

  return {
    id: String(battle._id),
    title: battle.title,
    description: battle.description ?? null,
    status: battle.status as BossBattleView["status"],
    milestones: battle.milestones.map((m) => ({
      id: String(m._id),
      title: m.title,
      done: m.done,
    })),
    totalMilestones: total,
    doneMilestones: done,
    progressPct: total ? Math.round((done / total) * 100) : 0,
    xpReward: bossXpReward(total),
    skillId: battle.skillId ?? null,
    skillName: skill?.name ?? null,
    deadline: battle.deadline ? new Date(battle.deadline).toISOString() : null,
    defeatedAt: battle.defeatedAt
      ? new Date(battle.defeatedAt).toISOString()
      : null,
    createdAt: new Date(battle.createdAt as Date).toISOString(),
  };
}

export type CreateBossInput = {
  title: string;
  description?: string;
  milestones: string[];
  skillId?: string | null;
  deadline?: Date | null;
};

export async function listBosses(userId: string): Promise<BossBattleView[]> {
  await connectToDatabase();
  const battles = await BossBattleModel.find({ userId }).sort({
    status: 1,
    createdAt: -1,
  });
  return battles.map(toView);
}

export async function createBoss(
  userId: string,
  input: CreateBossInput,
): Promise<BossBattleView> {
  await connectToDatabase();
  const battle = await BossBattleModel.create({
    userId,
    title: input.title,
    description: input.description ?? null,
    skillId: input.skillId ?? null,
    deadline: input.deadline ?? null,
    milestones: input.milestones
      .map((t) => t.trim())
      .filter(Boolean)
      .map((title) => ({ title, done: false })),
  });
  return toView(battle);
}

export async function deleteBoss(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await BossBattleModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}

export type ToggleMilestoneResult = {
  battle: BossBattleView;
  award: AwardResult | null;
  defeated: boolean;
};

export async function toggleMilestone(
  userId: string,
  battleId: string,
  milestoneId: string,
): Promise<ToggleMilestoneResult | null> {
  await connectToDatabase();
  const battle = await BossBattleModel.findOne({ _id: battleId, userId });
  if (!battle) return null;

  const milestone = battle.milestones.id(milestoneId);
  if (!milestone) return null;

  milestone.done = !milestone.done;

  const allDone =
    battle.milestones.length > 0 && battle.milestones.every((m) => m.done);

  let award: AwardResult | null = null;
  let defeated = false;

  if (allDone && battle.status === "active" && !battle.xpAwarded) {
    battle.status = "defeated";
    battle.defeatedAt = new Date();
    battle.xpAwarded = true;
    defeated = true;
  } else if (!allDone && battle.status === "defeated") {
    battle.status = "active";
    battle.defeatedAt = null;
  }

  await battle.save();

  if (defeated) {
    award = await awardXp(userId, {
      amount: bossXpReward(battle.milestones.length),
      source: "boss",
      skillId: battle.skillId ?? undefined,
      note: `Defeated boss: ${battle.title}`,
    });
  }

  return { battle: toView(battle), award, defeated };
}
