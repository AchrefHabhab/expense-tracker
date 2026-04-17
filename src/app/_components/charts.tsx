'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { categoryMap, type Transaction } from '@/types/transaction';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = [
  '#059669', '#10b981', '#34d399', '#6ee7b7',
  '#f59e0b', '#8b5cf6', '#ec4899', '#64748b',
];

export function Charts({ transactions }: ChartsProps) {
  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const grouped: Record<string, number> = {};

    for (const t of expenses) {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    }

    return Object.entries(grouped)
      .map(([cat, amount]) => ({
        name: categoryMap[cat]?.label ?? cat,
        emoji: categoryMap[cat]?.emoji ?? '📦',
        value: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    for (const t of transactions) {
      const month = format(new Date(t.date), 'MMM yyyy');
      if (!grouped[month]) grouped[month] = { income: 0, expense: 0 };
      grouped[month][t.type] += t.amount;
    }

    return Object.entries(grouped)
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
      }))
      .slice(-6); // last 6 months
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {categoryData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Expense Breakdown
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={35}
                  outerRadius={65}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, '']}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-muted-foreground">
                    {cat.emoji} {cat.name}
                  </span>
                  <span className="ml-auto font-medium text-foreground">
                    ${cat.value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Monthly Overview
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value, name) => [
                  `$${Number(value).toFixed(2)}`,
                  String(name).charAt(0).toUpperCase() + String(name).slice(1),
                ]}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey="income"
                fill="var(--income)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="expense"
                fill="var(--expense)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
