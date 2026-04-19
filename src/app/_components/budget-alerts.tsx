'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
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

interface Alert {
  id: string;
  severity: 'danger' | 'warning' | 'info';
  icon: typeof AlertTriangle;
  title: string;
  message: string;
}

interface BudgetAlertsProps {
  budget: BudgetData;
  transactions: Transaction[];
}

export function BudgetAlerts({ budget, transactions }: BudgetAlertsProps) {
  const alerts = useMemo(() => {
    if (budget.monthlySalary === 0) return [];

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = dayOfMonth / daysInMonth;

    const monthExpenses = transactions.filter(
      (t) =>
        t.type === 'expense' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
    );

    const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const spendable = budget.monthlySalary - budget.savingsGoal;

    const spentByCategory: Record<string, number> = {};
    for (const t of monthExpenses) {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    }

    const result: Alert[] = [];

    if (totalSpent > spendable) {
      result.push({
        id: 'overall-exceeded',
        severity: 'danger',
        icon: ShieldAlert,
        title: 'Budget Exceeded',
        message: `You've spent ${formatCurrency(totalSpent - spendable)} over your ${formatCurrency(spendable)} monthly budget.`,
      });
    } else if (totalSpent / spendable >= 0.8) {
      result.push({
        id: 'overall-warning',
        severity: 'warning',
        icon: AlertTriangle,
        title: 'Budget Running Low',
        message: `${((totalSpent / spendable) * 100).toFixed(0)}% of your monthly budget used with ${daysInMonth - dayOfMonth} days remaining.`,
      });
    }

    if (monthProgress > 0 && totalSpent > 0) {
      const projectedSpend = totalSpent / monthProgress;
      if (projectedSpend > spendable * 1.1 && totalSpent <= spendable) {
        result.push({
          id: 'projected-overspend',
          severity: 'info',
          icon: TrendingUp,
          title: 'Pace Alert',
          message: `At this rate, you'll spend ~${formatCurrency(projectedSpend)} this month (${formatCurrency(projectedSpend - spendable)} over budget).`,
        });
      }
    }

    for (const { key, category } of CATEGORY_KEYS) {
      const limit = budget[key] as number;
      if (limit === 0) continue;

      const spent = spentByCategory[category] ?? 0;
      const percent = spent / limit;
      const cat = expenseCategories.find((c) => c.value === category);
      const label = cat?.label ?? category;

      if (percent >= 1) {
        result.push({
          id: `cat-exceeded-${category}`,
          severity: 'danger',
          icon: ShieldAlert,
          title: `${label} Over Limit`,
          message: `${formatCurrency(spent)} spent of ${formatCurrency(limit)} limit (+${formatCurrency(spent - limit)}).`,
        });
      } else if (percent >= 0.8) {
        result.push({
          id: `cat-warning-${category}`,
          severity: 'warning',
          icon: AlertTriangle,
          title: `${label} Almost Full`,
          message: `${(percent * 100).toFixed(0)}% used — ${formatCurrency(limit - spent)} remaining.`,
        });
      }
    }

    return result;
  }, [budget, transactions]);

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-income/30 bg-income/5 px-4 py-3"
      >
        <CheckCircle2 className="size-4 shrink-0 text-income" />
        <p className="text-xs font-medium text-income">
          All spending is within budget — keep it up!
        </p>
      </motion.div>
    );
  }

  const severityStyles = {
    danger: {
      border: 'border-expense/30',
      bg: 'bg-expense/5',
      text: 'text-expense',
      iconColor: 'text-expense',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      text: 'text-amber-600 dark:text-amber-400',
      iconColor: 'text-amber-500',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      text: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-500',
    },
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((alert, i) => {
          const styles = severityStyles[alert.severity];
          const Icon = alert.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3',
                styles.border,
                styles.bg
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', styles.iconColor)} />
              <div>
                <p className={cn('text-xs font-semibold', styles.text)}>
                  {alert.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {alert.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
