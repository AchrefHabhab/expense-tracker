'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/session';
import type { ActionResult } from '@/types/action-result';
import type { Transaction, TransactionType } from '@/types/transaction';

export async function getTransactions(): Promise<ActionResult<Transaction[]>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: transactions as Transaction[] };
  } catch {
    return { success: false, error: 'Failed to load transactions' };
  }
}

export async function createTransaction(data: {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.transaction.create({
      data: {
        userId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to create transaction' };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.transaction.delete({ where: { id, userId } });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete transaction' };
  }
}

export async function updateTransaction(
  id: string,
  data: {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
  }
): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    await db.transaction.update({
      where: { id, userId },
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update transaction' };
  }
}
