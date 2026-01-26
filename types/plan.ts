
import { Meal } from './meal';
import { Substitution, BudgetSummary } from './finance';

export interface GroceryItem {
  ingredient: string;
  needed: boolean;
  usedInMeals: number;
  category: 'produce' | 'protein' | 'pantry' | 'dairy' | 'other'; // For better UX
}

export interface ScheduleItem {
  id: string;
  type: 'shop' | 'prep' | 'cook';
  day: number;
  timeBlock: string; // e.g., "Sunday Evening", "Day 1 18:00"
  description: string;
  durationMinutes: number;
}

export interface MealPlan {
  days: DayPlan[];
  groceryList: GroceryItem[];
  substitutions: Substitution[];
  budgetSummary: BudgetSummary;
  nutritionSummary: NutritionSummary;
  // Phase 2
  schedule: ScheduleItem[]; 
}

export interface DayPlan {
  day: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
  };
}

export interface NutritionSummary {
  perDay: {
    day: number;
    caloriesRange: string;
    proteinRange: string;
  }[];
}
