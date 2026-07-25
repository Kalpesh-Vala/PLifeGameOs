import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { VisionItemModel, type VisionItemDoc } from "@/modules/vision/models";
import type { VisionItemView } from "@/modules/vision/types";

function toView(doc: HydratedDocument<VisionItemDoc>): VisionItemView {
  return {
    id: String(doc._id),
    title: doc.title,
    imageUrl: doc.imageUrl ?? null,
    caption: doc.caption ?? null,
    category: doc.category ?? "Life",
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listVision(userId: string): Promise<VisionItemView[]> {
  await connectToDatabase();
  const docs = await VisionItemModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(200);
  return docs.map(toView);
}

export async function createVision(
  userId: string,
  input: {
    title: string;
    imageUrl?: string | null;
    caption?: string | null;
    category?: string;
  },
): Promise<VisionItemView> {
  await connectToDatabase();
  const doc = await VisionItemModel.create({
    userId,
    title: input.title,
    imageUrl: input.imageUrl ?? null,
    caption: input.caption ?? null,
    category: input.category || "Life",
  });
  return toView(doc);
}

export async function deleteVision(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await VisionItemModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
