
// Re-export all types from the structured types directory
export * from './types/enums';
export * from './types/input';
export * from './types/meal';
export * from './types/finance';
export * from './types/plan';

// Legacy CookingPlan interface for compatibility with root orchestrator
import { PrepChecklist } from './types/meal';
export interface CookingPlan {
  recipeName: string;
  todoList: string[];
  prepChecklist: {
    washing: string[];
    chopping: string[];
    marinating?: string[];
  };
  cookingSequence: string[];
  usedIngredients: string[];
}
