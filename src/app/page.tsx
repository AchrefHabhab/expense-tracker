import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTransactions } from './_actions/transaction-actions';
import { getBudget } from './_actions/budget-actions';
import { getRecurringTransactions } from './_actions/recurring-actions';
import { Dashboard } from './_components/dashboard';

export default async function Home() {
  const session = await auth();
  if (!session) redirect('/login');

  const [txResult, budgetResult, recurringResult] = await Promise.all([
    getTransactions(),
    getBudget(),
    getRecurringTransactions(),
  ]);

  return (
    <Dashboard
      transactions={txResult.data ?? []}
      budget={budgetResult.data ?? undefined}
      recurringTransactions={recurringResult.data ?? []}
      user={{ name: session.user?.name ?? '', image: session.user?.image ?? '' }}
    />
  );
}
