'use server';

import { db } from '@/lib/db';
import { getUserId } from '@/lib/session';
import type { ActionResult } from '@/types/action-result';
import { categoryMap } from '@/types/transaction';

interface ExportRow {
  date: string;
  description: string;
  type: string;
  category: string;
  amount: string;
}

export async function exportTransactionsCSV(
  month?: number,
  year?: number
): Promise<ActionResult<string>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const where: Record<string, unknown> = { userId };

    if (month !== undefined && year !== undefined) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      where.date = { gte: start, lt: end };
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    if (transactions.length === 0) {
      return { success: false, error: 'No transactions to export' };
    }

    const rows: ExportRow[] = transactions.map((t) => ({
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      type: t.type,
      category: categoryMap[t.category]?.label ?? t.category,
      amount: t.amount.toFixed(2),
    }));

    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        [r.date, `"${r.description.replace(/"/g, '""')}"`, r.type, `"${r.category}"`, r.amount].join(',')
      ),
    ];

    return { success: true, data: csvLines.join('\n') };
  } catch {
    return { success: false, error: 'Failed to export transactions' };
  }
}

export interface ReportData {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
  categoryBreakdown: { category: string; emoji: string; amount: number; percent: number }[];
  transactions: {
    date: string;
    description: string;
    type: string;
    category: string;
    amount: number;
  }[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function getMonthlyReportData(
  month: number,
  year: number
): Promise<ActionResult<ReportData>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const transactions = await db.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'desc' },
    });

    if (transactions.length === 0) {
      return { success: false, error: 'No transactions for this month' };
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    }

    const categoryBreakdown = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        category: categoryMap[cat]?.label ?? cat,
        emoji: categoryMap[cat]?.emoji ?? '📦',
        amount,
        percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }));

    const effectiveIncome = totalIncome > 0 ? totalIncome : 1;
    const savingsRate = ((effectiveIncome - totalExpenses) / effectiveIncome) * 100;

    return {
      success: true,
      data: {
        month: MONTH_NAMES[month],
        year,
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        savingsRate: Math.max(savingsRate, 0),
        transactionCount: transactions.length,
        categoryBreakdown,
        transactions: transactions.map((t) => ({
          date: t.date.toISOString().split('T')[0],
          description: t.description,
          type: t.type,
          category: categoryMap[t.category]?.label ?? t.category,
          amount: t.amount,
        })),
      },
    };
  } catch {
    return { success: false, error: 'Failed to generate report data' };
  }
}
