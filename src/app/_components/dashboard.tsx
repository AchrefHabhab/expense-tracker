'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Settings, Wallet } from 'lucide-react';
import type { Transaction } from '@/types/transaction';
import type { BudgetData } from '@/types/budget';
import type { RecurringTransaction } from '@/types/recurring';
import { ThemeToggle } from './theme-toggle';
import { SummaryCards } from './summary-cards';
import { AddTransaction } from './add-transaction';
import { TransactionList } from './transaction-list';
import { Charts } from './charts';
import { BudgetOverview } from './budget-overview';
import { SpendingStats } from './spending-stats';
import { ExportMenu } from './export-menu';
import { RecurringTransactions } from './recurring-transactions';
import { BudgetAlerts } from './budget-alerts';

interface DashboardProps {
  transactions: Transaction[];
  budget?: BudgetData;
  recurringTransactions: RecurringTransaction[];
  user: { name: string; image: string };
}

export function Dashboard({ transactions, budget, recurringTransactions, user }: DashboardProps) {
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    let transactionIncome = 0;
    let expenses = 0;

    for (const t of transactions) {
      if (t.type === 'income') transactionIncome += t.amount;
      else expenses += t.amount;
    }

    const income = Math.max(transactionIncome, budget?.monthlySalary ?? 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [transactions, budget?.monthlySalary]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt={user.name}
              width={36}
              height={36}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Hi, {user.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-xs text-muted-foreground">Track your finances</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu />
          <ThemeToggle />
          <Link
            href="/budget"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Budget"
          >
            <Wallet className="size-4" />
          </Link>
          <Link
            href="/settings"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <SummaryCards
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          balance={balance}
        />
      </div>

      {budget && (
        <div className="mb-6">
          <BudgetAlerts budget={budget} transactions={transactions} />
        </div>
      )}

      <div className="mb-6">
        <AddTransaction />
      </div>

      <div className="mb-6">
        <Charts transactions={transactions} />
      </div>

      {budget && (
        <div className="mb-6">
          <BudgetOverview budget={budget} transactions={transactions} />
        </div>
      )}

      <div className="mb-6">
        <SpendingStats
          transactions={transactions}
          monthlySalary={budget?.monthlySalary ?? 0}
        />
      </div>

      <div className="mb-6">
        <RecurringTransactions items={recurringTransactions} />
      </div>

      <TransactionList transactions={transactions} />
    </main>
  );
}
