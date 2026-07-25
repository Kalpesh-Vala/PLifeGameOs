"use client";

import * as React from "react";
import {
  Loader2,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showAwardToasts } from "@/modules/gamification/components/award-toast";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatMoney,
} from "@/modules/finance/lib/categories";
import type { TransactionType, TransactionView } from "@/modules/finance/types";

export function FinanceView() {
  const summary = trpc.finance.summary.useQuery();
  const list = trpc.finance.list.useQuery();
  const settings = trpc.settings.get.useQuery();
  const currency = settings.data?.currency ?? "₹";

  return (
    <div className="space-y-4">
      {summary.isLoading || !summary.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Income"
            value={summary.data.income}
            currency={currency}
            icon={<TrendingUp className="size-4" />}
            tone="success"
          />
          <SummaryCard
            label="Expenses"
            value={summary.data.expense}
            currency={currency}
            icon={<TrendingDown className="size-4" />}
            tone="destructive"
          />
          <SummaryCard
            label="Net"
            value={summary.data.net}
            currency={currency}
            icon={<Wallet className="size-4" />}
            tone={summary.data.net >= 0 ? "success" : "destructive"}
          />
        </div>
      )}

      <TransactionForm />

      {summary.data && summary.data.expenseByCategory.length > 0 && (
        <CategoryBreakdown
          items={summary.data.expenseByCategory}
          currency={currency}
        />
      )}

      <TransactionList
        transactions={list.data ?? []}
        loading={list.isLoading}
        currency={currency}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  icon,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
  tone: "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div
          className="flex size-9 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in oklab, var(--${tone}) 15%, transparent)`,
            color: `var(--${tone})`,
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-xl font-semibold leading-none">
            {formatMoney(value, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label} this month</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionForm() {
  const [type, setType] = React.useState<TransactionType>("expense");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<string>("Food");
  const [note, setNote] = React.useState("");

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const utils = trpc.useUtils();
  const create = trpc.finance.create.useMutation({
    onSuccess: (result) => {
      showAwardToasts(result.award, { description: "Transaction added" });
      if (!result.award) toast.success("Transaction added.");
      setAmount("");
      setNote("");
      void utils.finance.summary.invalidate();
      void utils.finance.list.invalidate();
      void utils.gamification.profile.invalidate();
      void utils.gamification.recentActivity.invalidate();
    },
    onError: () => toast.error("Could not add the transaction."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const amt = Number(amount);
            if (!amt || amt <= 0) return;
            create.mutate({ type, amount: amt, category, note: note || null });
          }}
        >
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setType("expense");
                setCategory("Food");
              }}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setType("income");
                setCategory("Salary");
              }}
            >
              Income
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
          />

          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add {type}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({
  items,
  currency,
}: {
  items: { category: string; amount: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.amount));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spending by category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((item) => (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{item.category}</span>
              <span className="text-muted-foreground">
                {formatMoney(item.amount, currency)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-destructive"
                style={{ width: `${(item.amount / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TransactionList({
  transactions,
  loading,
  currency,
}: {
  transactions: TransactionView[];
  loading: boolean;
  currency: string;
}) {
  const utils = trpc.useUtils();
  const remove = trpc.finance.delete.useMutation({
    onSuccess: () => {
      void utils.finance.list.invalidate();
      void utils.finance.summary.invalidate();
    },
  });

  if (loading) {
    return <Skeleton className="h-40 rounded-xl" />;
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <Wallet className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No transactions yet.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {transactions.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {t.category}
                  {t.note ? (
                    <span className="text-muted-foreground"> · {t.note}</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(t.date), "MMM d, yyyy")}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  t.type === "income" ? "text-success" : "text-destructive",
                )}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(t.amount, currency)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: t.id })}
                aria-label="Delete transaction"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
