'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createTransaction } from '../_actions/transaction-actions';
import {
  expenseCategories,
  incomeCategories,
  type TransactionType,
} from '@/types/transaction';

export function AddTransaction() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPending, startTransition] = useTransition();

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    startTransition(async () => {
      const result = await createTransaction({
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
        date,
      });

      if (result.success) {
        toast.success(`${type === 'income' ? 'Income' : 'Expense'} added`);
        resetForm();
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <AnimatePresence mode="wait">
      {!open ? (
        <motion.button
          key="trigger"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" />
          Add Transaction
        </motion.button>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-5"
        >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory(''); }}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
            type === 'expense'
              ? 'bg-expense/10 text-expense'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingDown className="size-4" />
          Expense
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategory(''); }}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
            type === 'income'
              ? 'bg-income/10 text-income'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="size-4" />
          Income
        </button>
      </div>

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        autoFocus
      />

      <div className="mb-3 flex gap-3">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors',
              category === cat.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            <span className="text-base">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={resetForm}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
      </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
