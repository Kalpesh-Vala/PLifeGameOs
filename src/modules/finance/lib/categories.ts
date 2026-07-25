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

/** Display currency symbol. Change this to match your locale (e.g. "$", "€"). */
export const CURRENCY = "₹";

export function formatMoney(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}
