import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A single skill's progress, embedded in the profile.
 */
const skillProgressSchema = new Schema(
  {
    skillId: { type: String, required: true },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
  },
  { _id: false },
);

/**
 * An unlocked achievement, embedded in the profile.
 */
const unlockedAchievementSchema = new Schema(
  {
    achievementId: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * The player profile: the aggregate root for a user's gamification state.
 * One document per user. `userId` maps to the Auth.js user id.
 */
const profileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    totalXp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    coins: { type: Number, default: 0, min: 0 },

    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    /** Last check-in date as an ISO date string (YYYY-MM-DD). */
    lastCheckIn: { type: String, default: null },
    checkInCount: { type: Number, default: 0, min: 0 },

    skills: { type: [skillProgressSchema], default: [] },
    achievements: { type: [unlockedAchievementSchema], default: [] },
  },
  { timestamps: true },
);

/**
 * Append-only ledger of XP grants. Powers analytics and the activity feed.
 */
const xpEventSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    source: { type: String, required: true },
    skillId: { type: String, default: null },
    note: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

xpEventSchema.index({ userId: 1, createdAt: -1 });

export type ProfileDoc = InferSchemaType<typeof profileSchema>;
export type XpEventDoc = InferSchemaType<typeof xpEventSchema>;

export const ProfileModel: Model<ProfileDoc> =
  (mongoose.models.Profile as Model<ProfileDoc>) ??
  mongoose.model<ProfileDoc>("Profile", profileSchema);

export const XpEventModel: Model<XpEventDoc> =
  (mongoose.models.XpEvent as Model<XpEventDoc>) ??
  mongoose.model<XpEventDoc>("XpEvent", xpEventSchema);
