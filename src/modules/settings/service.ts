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
    onboardedAt: doc.onboardedAt ? doc.onboardedAt.toISOString() : null,
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
    onboardedAt: doc!.onboardedAt ? doc!.onboardedAt.toISOString() : null,
  };
}

/** Marks onboarding as complete (and optionally sets a display name). */
export async function completeOnboarding(
  userId: string,
  displayName?: string | null,
): Promise<SettingsView> {
  await connectToDatabase();
  const set: Record<string, unknown> = { onboardedAt: new Date() };
  if (displayName !== undefined) set.displayName = displayName;
  const doc = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: set, $setOnInsert: { userId } },
    { upsert: true, new: true },
  );
  return {
    displayName: doc!.displayName ?? null,
    currency: doc!.currency,
    aiContextEnabled: doc!.aiContextEnabled,
    onboardedAt: doc!.onboardedAt ? doc!.onboardedAt.toISOString() : null,
  };
}

/** Reads just the AI-context permission flag (used server-side by AI). */
export async function isAiContextEnabled(userId: string): Promise<boolean> {
  const settings = await getSettings(userId);
  return settings.aiContextEnabled;
}
