import { connectToDatabase } from "@/server/db/mongoose";
import { UserSettingsModel } from "@/modules/settings/models";
import type { SettingsView } from "@/modules/settings/types";

export async function getSettings(userId: string): Promise<SettingsView> {
  await connectToDatabase();
  let doc = await UserSettingsModel.findOne({ userId });
  if (!doc) doc = await UserSettingsModel.create({ userId });
  return {
    displayName: doc.displayName ?? null,
    currency: doc.currency,
    aiContextEnabled: doc.aiContextEnabled,
  };
}

export type UpdateSettingsInput = {
  displayName?: string | null;
  currency?: string;
  aiContextEnabled?: boolean;
};

export async function updateSettings(
  userId: string,
  input: UpdateSettingsInput,
): Promise<SettingsView> {
  await connectToDatabase();
  const doc = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: input, $setOnInsert: { userId } },
    { upsert: true, new: true },
  );
  return {
    displayName: doc!.displayName ?? null,
    currency: doc!.currency,
    aiContextEnabled: doc!.aiContextEnabled,
  };
}

/** Reads just the AI-context permission flag (used server-side by AI). */
export async function isAiContextEnabled(userId: string): Promise<boolean> {
  const settings = await getSettings(userId);
  return settings.aiContextEnabled;
}
