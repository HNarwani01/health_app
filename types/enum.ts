
export enum DietType {
  VEG = 'veg',
  ANY = 'any',
  NON_VEG = 'non_veg',
  VEGAN = 'vegan'
}

export enum KitchenSetup {
  BASIC = 'basic',
  MEDIUM = 'medium',
  FULL = 'full'
}

export enum DayType {
  LOW_ENERGY = 'low_energy',
  NORMAL = 'normal',
  HIGH_ENERGY = 'high_energy',
  BUSY_WORKDAY = 'busy_workday',
  RELAXED_DAY = 'relaxed_day'
}

export type BudgetLevel = 'low' | 'medium' | 'flexible';

export const DietTypeLabels: Record<DietType, string> = {
  [DietType.VEG]: 'Vegetarian',
  [DietType.NON_VEG]: 'Non-Vegetarian',
  [DietType.VEGAN]: 'Vegan',
  [DietType.ANY]: 'Any'
};

export const DayTypeLabels: Record<DayType, string> = {
  [DayType.LOW_ENERGY]: '😴 Low Energy / Tired Day',
  [DayType.BUSY_WORKDAY]: '💼 Busy Workday',
  [DayType.NORMAL]: '🙂 Normal Day',
  [DayType.RELAXED_DAY]: '😌 Relaxed / Weekend',
  [DayType.HIGH_ENERGY]: '⚡ High Energy Day'
};

export interface EnhancementSuggestion {
  ingredient: string;
  reason: string;
}
