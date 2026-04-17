export type BudgetTemplate = '50-30-20' | '70-20-10' | '80-20' | 'custom';

export interface BudgetData {
  template: BudgetTemplate;
  monthlySalary: number;
  savingsGoal: number;
  needsPercent: number;
  wantsPercent: number;
  foodLimit: number;
  transportLimit: number;
  entertainmentLimit: number;
  shoppingLimit: number;
  billsLimit: number;
  healthLimit: number;
  educationLimit: number;
  otherLimit: number;
}

export const BUDGET_TEMPLATES: Record<
  BudgetTemplate,
  { label: string; description: string; needs: number; wants: number; savings: number }
> = {
  '50-30-20': {
    label: '50 / 30 / 20',
    description: 'Needs 50% · Wants 30% · Savings 20%',
    needs: 50,
    wants: 30,
    savings: 20,
  },
  '70-20-10': {
    label: '70 / 20 / 10',
    description: 'Living 70% · Savings 20% · Debt 10%',
    needs: 70,
    wants: 0,
    savings: 20,
  },
  '80-20': {
    label: '80 / 20',
    description: 'Spending 80% · Savings 20%',
    needs: 80,
    wants: 0,
    savings: 20,
  },
  custom: {
    label: 'Custom',
    description: 'Set your own percentages',
    needs: 50,
    wants: 30,
    savings: 20,
  },
};

export const DEFAULT_BUDGET: BudgetData = {
  template: 'custom',
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
