
import { CookingInput, MealPlan } from "../types";

export class PlanCache {
  private static storage = new Map<string, { plan: MealPlan; timestamp: number }>();
  private static TTL = 1000 * 60 * 30; // 30 minutes

  /**
   * Generates a deterministic key based on cooking inputs.
   * Sorts arrays (goals, ingredients, dislikes) to ensure consistency.
   */
  static generateKey(input: CookingInput): string {
    return JSON.stringify({
      persona: input.persona,
      goals: input.goals.slice().sort(),
      diet: input.diet,
      ingredients: input.ingredients.map(i => `${i.name}:${i.locked}`).sort(),
      dislikes: input.dislikes.slice().sort(),
      effort: input.effortLevel,
      protein: input.proteinLevel
    });
  }

  static get(input: CookingInput): MealPlan | null {
    const key = this.generateKey(input);
    const cached = this.storage.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.storage.delete(key);
      return null;
    }
    
    return cached.plan;
  }

  static set(input: CookingInput, plan: MealPlan): void {
    const key = this.generateKey(input);
    this.storage.set(key, { plan, timestamp: Date.now() });
  }

  static clear(): void {
    this.storage.clear();
  }
}
