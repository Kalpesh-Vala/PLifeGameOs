import { format } from "date-fns";
import type { HydratedDocument } from "mongoose";
import { connectToDatabase } from "@/server/db/mongoose";
import { dateKey } from "@/lib/date";
import { awardXp } from "@/modules/gamification/service";
import type { AwardResult } from "@/modules/gamification/types";
import {
  TransactionModel,
  type TransactionDoc,
} from "@/modules/finance/models";
import {
  FINANCE_XP,
  type FinanceSummary,
  type TransactionType,
  type TransactionView,
} from "@/modules/finance/types";

function toView(doc: HydratedDocument<TransactionDoc>): TransactionView {
  return {
    id: String(doc._id),
    date: doc.date,
    type: doc.type as TransactionType,
    amount: doc.amount,
    category: doc.category,
    note: doc.note ?? null,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

export async function listTransactions(
  userId: string,
  limit = 50,
): Promise<TransactionView[]> {
  await connectToDatabase();
  const docs = await TransactionModel.find({ userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit);
  return docs.map(toView);
}

export async function getMonthSummary(
  userId: string,
  monthKey = format(new Date(), "yyyy-MM"),
): Promise<FinanceSummary> {
  await connectToDatabase();
  const docs = await TransactionModel.find({
    userId,
    date: { $gte: `${monthKey}-01`, $lte: `${monthKey}-31` },
  }).lean();

  let income = 0;
  let expense = 0;
  const byCat = new Map<string, number>();

  for (const t of docs) {
    if (t.type === "income") income += t.amount;
    else {
      expense += t.amount;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    }
  }

  return {
    monthKey,
    income,
    expense,
    net: income - expense,
    transactionCount: docs.length,
    expenseByCategory: [...byCat.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  category: string;
  note?: string | null;
  date?: string;
};

export type CreateTransactionResult = {
  transaction: TransactionView;
  award: AwardResult | null;
};

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<CreateTransactionResult> {
  await connectToDatabase();
  const today = dateKey();
  const date = input.date ?? today;

  const countToday = await TransactionModel.countDocuments({
    userId,
    date: today,
  });

  const doc = await TransactionModel.create({
    userId,
    date,
    type: input.type,
    amount: input.amount,
    category: input.category,
    note: input.note ?? null,
  });

  // Reward the first transaction logged today (encourages consistent tracking).
  let award: AwardResult | null = null;
  if (date === today && countToday === 0) {
    award = await awardXp(userId, {
      amount: FINANCE_XP,
      source: "finance",
      skillId: "finance",
      note: "Tracked your finances",
    });
  }

  return { transaction: toView(doc), award };
}

export async function deleteTransaction(
  userId: string,
  id: string,
): Promise<boolean> {
  await connectToDatabase();
  const res = await TransactionModel.deleteOne({ _id: id, userId });
  return res.deletedCount > 0;
}
