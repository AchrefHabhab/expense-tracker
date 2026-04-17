'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { expenseCategories, type Transaction } from '@/types/transaction';
import type { BudgetData } from '@/types/budget';

const CATEGORY_KEYS: { key: keyof BudgetData; category: string }[] = [
  { key: 'foodLimit', category: 'food' },
  { key: 'transportLimit', category: 'transport' },
  { key: 'entertainmentLimit', category: 'entertainment' },
  { key: 'shoppingLimit', category: 'shopping' },
  { key: 'billsLimit', category: 'bills' },
  { key: 'healthLimit', category: 'health' },
  { key: 'educationLimit', category: 'education' },
  { key: 'otherLimit', category: 'other' },
];

const RING_SIZE = 120;
const STROKE_WIDTH = 10;

function ProgressRing({
  percent,
  size = RING_SIZE,
  strokeWidth = STROKE_WIDTH,
  color,
  trackColor = 'var(--muted)',
  children,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

interface BudgetOverviewProps {
  budget: BudgetData;
  transactions: Transaction[];
}

export function BudgetOverview({ budget, transactions }: BudgetOverviewProps) {
  if (budget.monthlySalary === 0) {
    return (
      <Link
        href="/budget"
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        Set up your budget to see spending insights
      </Link>
    );
  }

  const now = new Date();
  const monthExpenses = transactions.filter(
    (t) =>
      t.type === 'expense' &&
      new Date(t.date).getMonth() === now.getMonth() &&
      new Date(t.date).getFullYear() === now.getFullYear()
  );

  const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const spendable = budget.monthlySalary - budget.savingsGoal;
  const overallPercent = spendable > 0 ? Math.min((totalSpent / spendable) * 100, 100) : 0;

  const spentByCategory: Record<string, number> = {};
  for (const t of monthExpenses) {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
  }

  const activeCategories = CATEGORY_KEYS.filter(
    ({ key }) => (budget[key] as number) > 0
  );

  const ringColor = overallPercent >= 90
    ? 'var(--expense)'
    : overallPercent >= 70
      ? '#f59e0b'
      : 'var(--income)';

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Monthly Budget</h2>
        <Link href="/budget" className="text-xs font-medium text-primary hover:underline">
          Edit
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-6">
        <ProgressRing percent={overallPercent} color={ringColor}>
          <span
            className={cn(
              'text-lg font-bold',
              overallPercent >= 90 ? 'text-expense' : 'text-income'
            )}
          >
            {overallPercent.toFixed(0)}%
          </span>
          <span className="text-[10px] text-muted-foreground">spent</span>
        </ProgressRing>

        <div className="flex-1 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium text-foreground">{formatCurrency(spendable)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining</span>
            <span
              className={cn(
                'font-semibold',
                spendable - totalSpent >= 0 ? 'text-income' : 'text-expense'
              )}
            >
              {formatCurrency(Math.max(spendable - totalSpent, 0))}
            </span>
          </div>
        </div>
      </div>

      {activeCategories.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {activeCategories.map(({ key, category }, i) => {
            const limit = budget[key] as number;
            const spent = spentByCategory[category] ?? 0;
            const percent = Math.min((spent / limit) * 100, 100);
            const cat = expenseCategories.find((c) => c.value === category);
            const catColor =
              percent >= 90
                ? 'var(--expense)'
                : percent >= 70
                  ? '#f59e0b'
                  : 'var(--income)';

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center gap-1"
              >
                <ProgressRing
                  percent={percent}
                  size={52}
                  strokeWidth={5}
                  color={catColor}
                >
                  <span className="text-[10px] font-bold text-foreground">
                    {percent.toFixed(0)}%
                  </span>
                </ProgressRing>
                <span className="text-[10px] text-muted-foreground">
                  {cat?.emoji}
                </span>
                <span className="text-[10px] font-medium text-foreground truncate max-w-full">
                  {cat?.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
