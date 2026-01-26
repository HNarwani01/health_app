import { BudgetLevel } from './enums';

export interface Substitution {
  original: string;
  substitute: string;
  reason: string;
}

export interface BudgetSummary {
  level: BudgetLevel;
  verdict: 'feasible' | 'tight' | 'stretch';
  strategy: string[];
}