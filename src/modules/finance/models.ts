import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A financial transaction (income or expense).
 */
const transactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;

export const TransactionModel: Model<TransactionDoc> =
  (mongoose.models.Transaction as Model<TransactionDoc>) ??
  mongoose.model<TransactionDoc>("Transaction", transactionSchema);
