'use client';

import { useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { deleteTransaction } from '../_actions/transaction-actions';
import { categoryMap, type Transaction } from '@/types/transaction';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, description: string) => {
    startTransition(async () => {
      const result = await deleteTransaction(id);

      if (result.success) {
        toast.info(`"${description}" deleted`);
      } else {
        toast.error(result.error ?? 'Failed to delete');
      }
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-3xl">💸</p>
        <p className="mt-2 text-sm text-muted-foreground">
          No transactions yet. Add one above!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Recent Transactions
        </h2>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {transactions.map((t) => {
            const cat = categoryMap[t.category];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                  {cat?.emoji ?? '📦'}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {t.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cat?.label ?? t.category} · {format(new Date(t.date), 'MMM d, yyyy')}
                  </p>
                </div>

                <p
                  className={cn(
                    'text-sm font-semibold',
                    t.type === 'income' ? 'text-income' : 'text-expense'
                  )}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </p>

                <button
                  onClick={() => handleDelete(t.id, t.description)}
                  disabled={isPending}
                  className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label={`Delete ${t.description}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
