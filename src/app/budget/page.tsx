import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getBudget } from '../_actions/budget-actions';
import { BudgetForm } from './budget-form';

export default async function BudgetPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const result = await getBudget();
  const budget = result.data ?? {
    template: 'custom' as const,
    monthlySalary: 0,
    savingsGoal: 0,
    needsPercent: 50,
    wantsPercent: 30,
    foodLimit: 0,
    transportLimit: 0,
    entertainmentLimit: 0,
    shoppingLimit: 0,
    billsLimit: 0,
    healthLimit: 0,
    educationLimit: 0,
    otherLimit: 0,
  };

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Budget Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set your monthly salary and category spending limits
          </p>
        </div>

        <BudgetForm budget={budget} />
      </div>
    </div>
  );
}
