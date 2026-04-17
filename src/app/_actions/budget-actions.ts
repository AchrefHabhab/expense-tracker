'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/session';
import type { ActionResult } from '@/types/action-result';
import { DEFAULT_BUDGET, type BudgetData, type BudgetTemplate } from '@/types/budget';

export async function getBudget(): Promise<ActionResult<BudgetData>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const budget = await db.budget.findUnique({ where: { userId } });

    if (!budget) return { success: true, data: DEFAULT_BUDGET };

    return {
      success: true,
      data: {
        template: budget.template as BudgetTemplate,
        monthlySalary: budget.monthlySalary,
        savingsGoal: budget.savingsGoal,
        needsPercent: budget.needsPercent,
        wantsPercent: budget.wantsPercent,
        foodLimit: budget.foodLimit,
        transportLimit: budget.transportLimit,
        entertainmentLimit: budget.entertainmentLimit,
        shoppingLimit: budget.shoppingLimit,
        billsLimit: budget.billsLimit,
        healthLimit: budget.healthLimit,
        educationLimit: budget.educationLimit,
        otherLimit: budget.otherLimit,
      },
    };
  } catch {
    return { success: false, error: 'Failed to load budget' };
  }
}

export async function updateBudget(data: BudgetData): Promise<ActionResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: 'Not authenticated' };

    const budgetFields = {
      template: data.template,
      monthlySalary: data.monthlySalary,
      savingsGoal: data.savingsGoal,
      needsPercent: data.needsPercent,
      wantsPercent: data.wantsPercent,
      foodLimit: data.foodLimit,
      transportLimit: data.transportLimit,
      entertainmentLimit: data.entertainmentLimit,
      shoppingLimit: data.shoppingLimit,
      billsLimit: data.billsLimit,
      healthLimit: data.healthLimit,
      educationLimit: data.educationLimit,
      otherLimit: data.otherLimit,
    };

    await db.budget.upsert({
      where: { userId },
      create: { user: { connect: { id: userId } }, ...budgetFields },
      update: budgetFields,
    });

    revalidatePath('/budget');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update budget' };
  }
}
