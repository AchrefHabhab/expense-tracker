'use client';

import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import { BUDGET_TEMPLATES, type BudgetData, type BudgetTemplate } from '@/types/budget';
import { updateBudget } from '../_actions/budget-actions';
import { expenseCategories } from '@/types/transaction';

const CATEGORY_BUDGET_KEYS: { key: keyof BudgetData; category: string; isNeed: boolean }[] = [
  { key: 'foodLimit', category: 'food', isNeed: true },
  { key: 'transportLimit', category: 'transport', isNeed: true },
  { key: 'billsLimit', category: 'bills', isNeed: true },
  { key: 'healthLimit', category: 'health', isNeed: true },
  { key: 'educationLimit', category: 'education', isNeed: true },
  { key: 'entertainmentLimit', category: 'entertainment', isNeed: false },
  { key: 'shoppingLimit', category: 'shopping', isNeed: false },
  { key: 'otherLimit', category: 'other', isNeed: false },
];

const DONUT_SIZE = 180;
const DONUT_STROKE = 22;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;

const SEGMENT_COLORS = {
  needs: 'var(--income)',
  wants: 'var(--primary)',
  savings: 'var(--accent)',
};

interface BudgetFormProps {
  budget: BudgetData;
}

export function BudgetForm({ budget }: BudgetFormProps) {
  const [form, setForm] = useState<BudgetData>(budget);
  const [isPending, startTransition] = useTransition();

  const savingsPercent = Math.max(100 - form.needsPercent - form.wantsPercent, 0);
  const needsAmount = (form.monthlySalary * form.needsPercent) / 100;
  const wantsAmount = (form.monthlySalary * form.wantsPercent) / 100;
  const savingsAmount = (form.monthlySalary * savingsPercent) / 100;

  const totalLimits = CATEGORY_BUDGET_KEYS.reduce(
    (sum, { key }) => sum + (form[key] as number),
    0
  );
  const remaining = form.monthlySalary - form.savingsGoal - totalLimits;

  const spendable = form.monthlySalary - form.savingsGoal;

  const updateField = (key: keyof BudgetData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const updateSlider = useCallback(
    (key: keyof BudgetData, value: number) => {
      setForm((prev) => ({ ...prev, [key]: Math.round(value * 100) / 100 }));
    },
    []
  );

  const applyTemplate = useCallback((templateKey: BudgetTemplate) => {
    const tpl = BUDGET_TEMPLATES[templateKey];
    setForm((prev) => ({
      ...prev,
      template: templateKey,
      needsPercent: tpl.needs,
      wantsPercent: tpl.wants,
      savingsGoal: (prev.monthlySalary * tpl.savings) / 100,
    }));
  }, []);

  const autoDistribute = useCallback(() => {
    const needsBudget = (form.monthlySalary * form.needsPercent) / 100;
    const wantsBudget = (form.monthlySalary * form.wantsPercent) / 100;

    const needCategories = CATEGORY_BUDGET_KEYS.filter((c) => c.isNeed);
    const wantCategories = CATEGORY_BUDGET_KEYS.filter((c) => !c.isNeed);

    const perNeed = needCategories.length > 0 ? needsBudget / needCategories.length : 0;
    const perWant = wantCategories.length > 0 ? wantsBudget / wantCategories.length : 0;

    const updates: Partial<BudgetData> = {};
    for (const { key, isNeed } of CATEGORY_BUDGET_KEYS) {
      (updates as Record<string, number>)[key] = Math.round((isNeed ? perNeed : perWant) * 100) / 100;
    }

    setForm((prev) => ({
      ...prev,
      ...updates,
      savingsGoal: (prev.monthlySalary * savingsPercent) / 100,
    }));
  }, [form.monthlySalary, form.needsPercent, form.wantsPercent, savingsPercent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBudget(form);
      if (result.success) {
        toast.success('Budget saved');
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  const needsArc = (form.needsPercent / 100) * DONUT_CIRC;
  const wantsArc = (form.wantsPercent / 100) * DONUT_CIRC;
  const savingsArc = (savingsPercent / 100) * DONUT_CIRC;
  const needsOffset = 0;
  const wantsOffset = needsArc;
  const savingsOffset = needsArc + wantsArc;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Choose a budgeting method
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(BUDGET_TEMPLATES) as [BudgetTemplate, typeof BUDGET_TEMPLATES[BudgetTemplate]][]).map(
            ([key, tpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyTemplate(key)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all',
                  form.template === key
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <p className="text-sm font-semibold text-foreground">{tpl.label}</p>
                <p className="text-xs text-muted-foreground">{tpl.description}</p>
              </button>
            )
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">
            <DollarSign className="size-4 text-income" />
            Monthly Salary (after tax)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.monthlySalary || ''}
            onChange={(e) => updateField('monthlySalary', e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>

      {form.monthlySalary > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-5 space-y-5"
        >
          <h2 className="text-sm font-semibold text-foreground">Income Allocation</h2>

          <div className="flex items-center gap-6">
            <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
              <svg width={DONUT_SIZE} height={DONUT_SIZE} className="-rotate-90">
                <circle
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth={DONUT_STROKE}
                />
                <motion.circle
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={SEGMENT_COLORS.needs}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${needsArc} ${DONUT_CIRC - needsArc}`}
                  strokeDashoffset={-needsOffset}
                  initial={false}
                  animate={{ strokeDasharray: `${needsArc} ${DONUT_CIRC - needsArc}` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.circle
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={SEGMENT_COLORS.wants}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${wantsArc} ${DONUT_CIRC - wantsArc}`}
                  strokeDashoffset={-wantsOffset}
                  initial={false}
                  animate={{ strokeDasharray: `${wantsArc} ${DONUT_CIRC - wantsArc}` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.circle
                  cx={DONUT_SIZE / 2}
                  cy={DONUT_SIZE / 2}
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={SEGMENT_COLORS.savings}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${savingsArc} ${DONUT_CIRC - savingsArc}`}
                  strokeDashoffset={-savingsOffset}
                  initial={false}
                  animate={{ strokeDasharray: `${savingsArc} ${DONUT_CIRC - savingsArc}` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(form.monthlySalary)}
                </span>
                <span className="text-[10px] text-muted-foreground">monthly</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <PercentSlider
                label="Needs"
                emoji="🏠"
                value={form.needsPercent}
                max={100 - form.wantsPercent}
                amount={needsAmount}
                color="var(--income)"
                colorClass="text-income"
                bgClass="bg-income"
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, needsPercent: v, template: 'custom' }));
                }}
              />
              <PercentSlider
                label="Wants"
                emoji="🎉"
                value={form.wantsPercent}
                max={100 - form.needsPercent}
                amount={wantsAmount}
                color="var(--primary)"
                colorClass="text-primary"
                bgClass="bg-primary"
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, wantsPercent: v, template: 'custom' }));
                }}
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    💰 Savings
                  </span>
                  <span className="text-xs font-bold text-accent">
                    {savingsPercent}% · {formatCurrency(savingsAmount)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${savingsPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Auto-calculated from remaining</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {form.monthlySalary > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Category Budgets</h2>
            <button
              type="button"
              onClick={autoDistribute}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Sparkles className="size-3" />
              Auto-fill
            </button>
          </div>

          <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-income" />
              Needs
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-primary" />
              Wants
            </span>
          </div>

          <div className="space-y-4">
            {CATEGORY_BUDGET_KEYS.map(({ key, category, isNeed }, i) => {
              const cat = expenseCategories.find((c) => c.value === category);
              const value = form[key] as number;
              const maxVal = spendable > 0 ? spendable : form.monthlySalary;
              const percent = maxVal > 0 ? (value / maxVal) * 100 : 0;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span className={cn(
                        'inline-block size-1.5 rounded-full',
                        isNeed ? 'bg-income' : 'bg-primary'
                      )} />
                      <span>{cat?.emoji}</span>
                      {cat?.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatCurrency(value)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            isNeed ? 'bg-income' : 'bg-primary'
                          )}
                          initial={false}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={maxVal}
                        step={5}
                        value={value}
                        onChange={(e) => updateSlider(key, parseFloat(e.target.value))}
                        className="absolute inset-0 h-2.5 w-full cursor-pointer opacity-0"
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value || ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right text-xs outline-none transition-colors focus:border-primary"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Savings goal</span>
          <span className="font-medium text-foreground">{formatCurrency(form.savingsGoal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Category limits</span>
          <span className="font-medium text-foreground">{formatCurrency(totalLimits)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unallocated</span>
            <span className={cn('font-semibold', remaining >= 0 ? 'text-income' : 'text-expense')}>
              {formatCurrency(remaining)}
            </span>
          </div>
          {form.monthlySalary > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  remaining >= 0 ? 'bg-income' : 'bg-expense'
                )}
                initial={false}
                animate={{
                  width: `${Math.min(((totalLimits + form.savingsGoal) / form.monthlySalary) * 100, 100)}%`,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Budget'}
      </button>

      <Link
        href="/"
        className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>
    </form>
  );
}

function PercentSlider({
  label,
  emoji,
  value,
  max,
  amount,
  color,
  colorClass,
  bgClass,
  onChange,
}: {
  label: string;
  emoji: string;
  value: number;
  max: number;
  amount: number;
  color: string;
  colorClass: string;
  bgClass: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {emoji} {label}
        </span>
        <span className={cn('text-xs font-bold', colorClass)}>
          {value}% · {formatCurrency(amount)}
        </span>
      </div>
      <div className="relative">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn('h-full rounded-full', bgClass)}
            initial={false}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
          style={{ accentColor: color }}
        />
      </div>
    </div>
  );
}
