export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

export type IncomeCategory = 'salary' | 'freelance' | 'investment' | 'other';

export type Category = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const expenseCategories: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food & Dining', emoji: '🍔' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'bills', label: 'Bills & Utilities', emoji: '💡' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

export const incomeCategories: { value: IncomeCategory; label: string; emoji: string }[] = [
  { value: 'salary', label: 'Salary', emoji: '💰' },
  { value: 'freelance', label: 'Freelance', emoji: '💻' },
  { value: 'investment', label: 'Investment', emoji: '📈' },
  { value: 'other', label: 'Other', emoji: '💵' },
];

export const categoryMap: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  [...expenseCategories, ...incomeCategories].map((c) => [c.value, { label: c.label, emoji: c.emoji }])
);
