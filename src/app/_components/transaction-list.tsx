'use client';

import { useState, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { deleteTransaction } from '../_actions/transaction-actions';
import {
  categoryMap,
  expenseCategories,
  incomeCategories,
  type Transaction,
  type TransactionType,
} from '@/types/transaction';

const PAGE_SIZE = 10;

type SortKey = 'date' | 'amount' | 'description';
type SortDir = 'asc' | 'desc';

const allCategories = [...expenseCategories, ...incomeCategories];

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (categoryMap[t.category]?.label ?? t.category).toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((t) => new Date(t.date) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.date) <= to);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else cmp = a.description.localeCompare(b.description);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const safePage = Math.min(page, totalPages - 1);
  if (safePage !== page) setPage(safePage);

  const activeFilterCount = [
    typeFilter !== 'all',
    categoryFilter !== 'all',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(0);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Transactions
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({filtered.length})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <X className="size-3" />
                Clear ({activeFilterCount})
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                filtersOpen
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
            </button>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search transactions..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4">
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value as TransactionType | 'all'); setPage(0); }}
                  className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none transition-colors focus:border-primary"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                  className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none transition-colors focus:border-primary"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                  className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none transition-colors focus:border-primary"
                  placeholder="From"
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                  className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none transition-colors focus:border-primary"
                  placeholder="To"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 flex gap-1">
          {([
            { key: 'date' as SortKey, label: 'Date' },
            { key: 'amount' as SortKey, label: 'Amount' },
            { key: 'description' as SortKey, label: 'Name' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                sortKey === key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {sortKey === key && (
                <ArrowUpDown className="size-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <AnimatePresence mode="popLayout">
          {paged.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 py-8 text-center text-sm text-muted-foreground"
            >
              No transactions match your filters
            </motion.div>
          ) : (
            paged.map((t) => {
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
            })
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
