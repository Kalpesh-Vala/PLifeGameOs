export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Health",
  "Entertainment",
  "Shopping",
  "Bills",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Other",
] as const;

export const ALL_CATEGORIES = [
  ...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]),
] as string[];

/** Default display currency symbol; overridable per user in Settings. */
export const CURRENCY = "₹";

export function formatMoney(amount: number, currency: string = CURRENCY): string {
  return `${currency}${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}
