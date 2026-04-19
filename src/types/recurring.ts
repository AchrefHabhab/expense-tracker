import type { TransactionType } from './transaction';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: Frequency;
  nextRunDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const frequencyLabels: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};
