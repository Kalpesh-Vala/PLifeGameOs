export type TransactionType = "income" | "expense";

export type TransactionView = {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  createdAt: string;
};

export type CategoryTotal = {
  category: string;
  amount: number;
};

export type FinanceSummary = {
  monthKey: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
  expenseByCategory: CategoryTotal[];
};

export const FINANCE_XP = 10;
