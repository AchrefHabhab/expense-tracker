'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/session';
import type { ActionResult } from '@/types/action-result';
import type { RecurringTransaction, Frequency } from '@/types/recurring';
import type { TransactionType } from '@/types/transaction';

export async function getRecurringTransactions(): Promise<ActionResult<RecurringTransaction[]>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const items = await db.recurringTransaction.findMany({
      where: { userId },
      orderBy: { nextRunDate: 'asc' },
    });

    return { success: true, data: items as RecurringTransaction[] };
  } catch {
    return { success: false, error: 'Failed to load recurring transactions' };
  }
}

export async function createRecurringTransaction(data: {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: Frequency;
  startDate: string;
}): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.recurringTransaction.create({
      data: {
        userId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        frequency: data.frequency,
        nextRunDate: new Date(data.startDate),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to create recurring transaction' };
  }
}

export async function toggleRecurring(id: string, active: boolean): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.recurringTransaction.update({
      where: { id, userId },
      data: { active },
    });

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update recurring transaction' };
  }
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.recurringTransaction.delete({ where: { id, userId } });

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete recurring transaction' };
  }
}

function computeNextRunDate(current: Date, frequency: Frequency): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function processRecurringTransactions(): Promise<ActionResult<number>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const now = new Date();

    const due = await db.recurringTransaction.findMany({
      where: {
        userId,
        active: true,
        nextRunDate: { lte: now },
      },
    });

    if (due.length === 0) {
      return { success: true, data: 0 };
    }

    for (const item of due) {
      await db.transaction.create({
        data: {
          userId,
          description: item.description,
          amount: item.amount,
          type: item.type,
          category: item.category,
          date: item.nextRunDate,
        },
      });

      const nextDate = computeNextRunDate(item.nextRunDate, item.frequency as Frequency);
      await db.recurringTransaction.update({
        where: { id: item.id },
        data: { nextRunDate: nextDate },
      });
    }

    revalidatePath('/');
    return { success: true, data: due.length };
  } catch {
    return { success: false, error: 'Failed to process recurring transactions' };
  }
}
