
import { DietType, KitchenSetup, DayType, BudgetLevel } from './enums';

export type UserPersona = 'student' | 'professional' | 'family';
export type CookingGoal = 'save_time' | 'save_money' | 'eat_healthy' | 'build_muscle';
export type EffortLevel = 'minimal' | 'balanced' | 'ambitious';
export type ProteinLevel = 'normal' | 'high';

export interface IngredientInput {
  name: string;
  locked: boolean; // If true, AI MUST use this
}

export interface CookingInput {
  // Phase 1
  diet: DietType;
  kitchenSetup: KitchenSetup;
  days: 1 | 2 | 3;
  budgetLevel: BudgetLevel;
  
  // Phase 2 New Fields
  persona: UserPersona;
  goals: CookingGoal[];
  dislikes: string[]; // e.g. ["mushrooms", "cilantro"]
  ingredients: IngredientInput[];
  
  // Phase 3 Personalization
  effortLevel: EffortLevel;
  proteinLevel: ProteinLevel;

  // Derived/Computed by Persona if not overridden
  timeAvailable: number; 
  dayType: DayType;
}
