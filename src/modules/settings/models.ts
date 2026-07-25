import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Per-user preferences. One document per user.
 */
const userSettingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: null },
    currency: { type: String, default: "₹" },
    aiContextEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    onboardedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserSettingsDoc = InferSchemaType<typeof userSettingsSchema>;

export const UserSettingsModel: Model<UserSettingsDoc> =
  (mongoose.models.UserSettings as Model<UserSettingsDoc>) ??
  mongoose.model<UserSettingsDoc>("UserSettings", userSettingsSchema);
