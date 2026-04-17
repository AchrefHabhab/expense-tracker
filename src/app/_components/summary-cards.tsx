'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AnimatedNumber } from './animated-number';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpenses, balance }: SummaryCardsProps) {
  const format = useCallback((n: number) => formatCurrency(n), []);

  const cards = [
    {
      label: 'Balance',
      value: balance,
      prefix: '',
      icon: Wallet,
      color: balance >= 0 ? 'text-primary' : 'text-destructive',
      bg: balance >= 0 ? 'bg-primary/10' : 'bg-destructive/10',
    },
    {
      label: 'Income',
      value: totalIncome,
      prefix: '',
      icon: TrendingUp,
      color: 'text-income',
      bg: 'bg-income/10',
    },
    {
      label: 'Expenses',
      value: totalExpenses,
      prefix: '-',
      icon: TrendingDown,
      color: 'text-expense',
      bg: 'bg-expense/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <div className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>
            {card.prefix}
            <AnimatedNumber value={card.value} formatFn={format} />
          </p>
        </motion.div>
      ))}
    </div>
  );
}
