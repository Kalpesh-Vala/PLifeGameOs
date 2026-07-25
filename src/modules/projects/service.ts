import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import { ProjectModel, type ProjectDoc } from "@/modules/projects/models";
import {
  PROJECT_XP,
  type ProjectStatus,
  type ProjectView,
} from "@/modules/projects/types";

function toView(doc: HydratedDocument<ProjectDoc>): ProjectView {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? null,
    status: doc.status as ProjectStatus,
    techStack: doc.techStack ?? [],
    url: doc.url ?? null,
    repoUrl: doc.repoUrl ?? null,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listProjects(userId: string): Promise<ProjectView[]> {
  await connectToDatabase();
  const docs = await ProjectModel.find({ userId }).sort({ createdAt: -1 });
  return docs.map(toView);
}

export type CreateProjectInput = {
  title: string;
  description?: string | null;
  status?: ProjectStatus;
  techStack?: string[];
  url?: string | null;
  repoUrl?: string | null;
};

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectView> {
  await connectToDatabase();
  const doc = await ProjectModel.create({
    userId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "building",
    techStack: input.techStack ?? [],
    url: input.url ?? null,
    repoUrl: input.repoUrl ?? null,
  });
  return toView(doc);
}

export type SetProjectStatusResult = {
  project: ProjectView;
  award: AwardResult | null;
};

export async function setProjectStatus(
  userId: string,
  id: string,
  status: ProjectStatus,
): Promise<SetProjectStatusResult | null> {
  await connectToDatabase();
  const doc = await ProjectModel.findOne({ _id: id, userId });
  if (!doc) return null;

  doc.status = status;

  let award: AwardResult | null = null;
  if (status === "shipped" && !doc.xpAwarded) {
    doc.xpAwarded = true;
    await doc.save();
    award = await awardXp(userId, {
      amount: PROJECT_XP,
      source: "project",
      skillId: "programming",
      note: `Shipped project: ${doc.title}`,
    });
  } else {
    await doc.save();
  }

  return { project: toView(doc), award };
}

export async function deleteProject(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await ProjectModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
