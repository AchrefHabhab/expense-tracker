'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Calendar, PiggyBank, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { categoryMap, type Transaction } from '@/types/transaction';

interface SpendingStatsProps {
  transactions: Transaction[];
  monthlySalary: number;
}

export function SpendingStats({ transactions, monthlySalary }: SpendingStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const monthExpenses = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    );

    const monthIncome = transactions.filter(
      (t) =>
        t.type === 'income' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    );

    const totalExpenses = monthExpenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);
    const effectiveIncome = monthlySalary > 0 ? monthlySalary : totalIncome;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const dailyAvg = daysPassed > 0 ? totalExpenses / daysPassed : 0;
    const projectedSpend = dailyAvg * daysInMonth;

    const savingsRate = effectiveIncome > 0
      ? ((effectiveIncome - totalExpenses) / effectiveIncome) * 100
      : 0;

    const categoryTotals: Record<string, number> = {};
    for (const t of monthExpenses) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    return {
      totalExpenses,
      dailyAvg,
      projectedSpend,
      savingsRate,
      topCategory: topCategory
        ? { name: categoryMap[topCategory[0]]?.label ?? topCategory[0], emoji: categoryMap[topCategory[0]]?.emoji ?? '📦', amount: topCategory[1] }
        : null,
      transactionCount: monthExpenses.length,
    };
  }, [transactions, monthlySalary]);

  if (stats.transactionCount === 0) return null;

  const items = [
    {
      label: 'Daily Average',
      value: formatCurrency(stats.dailyAvg),
      sub: `${formatCurrency(stats.projectedSpend)} projected`,
      icon: Calendar,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Savings Rate',
      value: `${Math.max(stats.savingsRate, 0).toFixed(0)}%`,
      sub: stats.savingsRate >= 20 ? 'On track' : 'Below 20% target',
      icon: PiggyBank,
      color: stats.savingsRate >= 20 ? 'text-income' : 'text-expense',
      bg: stats.savingsRate >= 20 ? 'bg-income/10' : 'bg-expense/10',
    },
    {
      label: 'Top Category',
      value: stats.topCategory ? `${stats.topCategory.emoji} ${stats.topCategory.name}` : '—',
      sub: stats.topCategory ? formatCurrency(stats.topCategory.amount) : '',
      icon: Award,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Transactions',
      value: `${stats.transactionCount}`,
      sub: 'this month',
      icon: TrendingDown,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        Monthly Insights
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-lg border border-border p-3"
          >
            <div className={`rounded-lg p-2 ${item.bg}`}>
              <item.icon className={`size-4 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="truncate text-sm font-semibold text-foreground">{item.value}</p>
              {item.sub && (
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
