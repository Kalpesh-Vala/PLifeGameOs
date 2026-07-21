import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A generated quest board for a user for a given period (a day or an ISO week).
 * Progress is computed live from the XP ledger; only the `claimed` flag and the
 * chosen quest definitions are persisted.
 */
const questEntrySchema = new Schema(
  {
    defId: { type: String, required: true },
    claimed: { type: Boolean, default: false },
  },
  { _id: false },
);

const questBoardSchema = new Schema(
  {
    userId: { type: String, required: true },
    period: { type: String, enum: ["daily", "weekly"], required: true },
    periodKey: { type: String, required: true },
    quests: { type: [questEntrySchema], default: [] },
  },
  { timestamps: true },
);

questBoardSchema.index(
  { userId: 1, period: 1, periodKey: 1 },
  { unique: true },
);

export type QuestBoardDoc = InferSchemaType<typeof questBoardSchema>;

export const QuestBoardModel: Model<QuestBoardDoc> =
  (mongoose.models.QuestBoard as Model<QuestBoardDoc>) ??
  mongoose.model<QuestBoardDoc>("QuestBoard", questBoardSchema);
