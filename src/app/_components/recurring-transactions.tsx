'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Pause, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import {
  createRecurringTransaction,
  toggleRecurring,
  deleteRecurring,
  processRecurringTransactions,
} from '../_actions/recurring-actions';
import {
  categoryMap,
  expenseCategories,
  incomeCategories,
  type TransactionType,
} from '@/types/transaction';
import type { RecurringTransaction, Frequency } from '@/types/recurring';
import { frequencyLabels } from '@/types/recurring';

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

interface RecurringTransactionsProps {
  items: RecurringTransaction[];
}

export function RecurringTransactions({ items }: RecurringTransactionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!description || !amount || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    startTransition(async () => {
      const result = await createRecurringTransaction({
        description,
        amount: parseFloat(amount),
        type,
        category,
        frequency,
        startDate,
      });

      if (result.success) {
        toast.success('Recurring transaction created');
        resetForm();
      } else {
        toast.error(result.error ?? 'Failed to create');
      }
    });
  };

  const handleToggle = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const result = await toggleRecurring(id, !currentActive);
      if (result.success) {
        toast.info(currentActive ? 'Paused' : 'Resumed');
      } else {
        toast.error(result.error ?? 'Failed to update');
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteRecurring(id);
      if (result.success) {
        toast.info('Recurring transaction deleted');
      } else {
        toast.error(result.error ?? 'Failed to delete');
      }
    });
  };

  const handleProcess = () => {
    startTransition(async () => {
      const result = await processRecurringTransactions();
      if (result.success) {
        const count = result.data ?? 0;
        if (count > 0) {
          toast.success(`${count} recurring transaction${count > 1 ? 's' : ''} processed`);
        } else {
          toast.info('No recurring transactions due yet');
        }
      } else {
        toast.error(result.error ?? 'Failed to process');
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Recurring
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({items.length})
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleProcess}
            disabled={isPending || items.filter((i) => i.active).length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
          >
            <RefreshCw className={cn('size-3', isPending && 'animate-spin')} />
            Process Due
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              showForm
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            )}
          >
            {showForm ? <X className="size-3" /> : <Plus className="size-3" />}
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="space-y-3 px-5 py-4">
              <div className="flex gap-2">
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setType(t); setCategory(''); }}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-xs font-medium transition-colors',
                      type === t
                        ? t === 'expense'
                          ? 'bg-expense/10 text-expense'
                          : 'bg-income/10 text-income'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (e.g. Netflix, Rent)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  step="0.01"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">Category</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={isPending}
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? 'Creating...' : 'Create Recurring'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-2xl">🔄</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No recurring transactions yet
          </p>
        </div>
      ) : (
        <div>
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const cat = categoryMap[item.category];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'group flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0',
                    !item.active && 'opacity-50'
                  )}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                    {cat?.emoji ?? '📦'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {frequencyLabels[item.frequency]} · Next: {format(new Date(item.nextRunDate), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <p
                    className={cn(
                      'text-sm font-semibold',
                      item.type === 'income' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount)}
                  </p>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleToggle(item.id, item.active)}
                      disabled={isPending}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={item.active ? 'Pause' : 'Resume'}
                    >
                      {item.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
