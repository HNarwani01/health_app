
import { GoogleGenAI, Type } from "@google/genai";
import { CookingInput, CookingPlan } from "./types";

export class CookingOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Generates a cooking plan based on user constraints and ingredients.
   */
  async generatePlan(input: CookingInput): Promise<CookingPlan> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: this.buildPrompt(input),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipeName: { type: Type.STRING },
            todoList: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '8-12 actionable items'
            },
            prepChecklist: {
              type: Type.OBJECT,
              properties: {
                washing: { type: Type.ARRAY, items: { type: Type.STRING } },
                chopping: { type: Type.ARRAY, items: { type: Type.STRING } },
                marinating: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['washing', 'chopping']
            },
            cookingSequence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Step-by-step time-aware flow'
            },
            usedIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Must include at least 3 from provided list'
            }
          },
          required: ['recipeName', 'todoList', 'prepChecklist', 'cookingSequence', 'usedIngredients']
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}') as CookingPlan;
    } catch (error) {
      console.error("Failed to parse AI response", error);
      throw new Error("Logic error in recipe generation.");
    }
  }

  private buildPrompt(input: CookingInput): string {
  return `
You are a professional home chef and meal planner.

Plan meals for ${input.days} day(s).
Each day MUST include:
- Breakfast
- Lunch
- Dinner

For EACH meal, you MUST provide:
1. A clear recipe name
2. A short recipe description (1–2 lines)
3. A realistic to-do list (5–8 cooking actions)
4. A step-by-step cooking sequence (6–10 steps)
5. Used ingredients (explicit list)
6. Approximate nutrition (protein & calories)

Constraints:
- Diet: ${input.diet}
- Time per meal: ${input.timeAvailable} minutes
- Kitchen setup: ${input.kitchenSetup}
- Day energy level: ${input.dayType}
- Budget: ${input.budgetLevel}
- Available ingredients: ${input.ingredients.join(', ')}

Kitchen adaptation rules (IMPORTANT):
- If oven is not available, use stovetop, pressure cooker, or pan
- If deep frying is not possible, use shallow fry or sauté
- If advanced tools are unavailable, simplify the method
- Always adapt techniques to the kitchen setup (${input.kitchenSetup})

Planning rules:
- Reuse ingredients across meals to reduce cost
- Use at least 3 provided ingredients per day
- Keep recipes realistic for a home kitchen
- Prefer one-pot or pressure-cooker methods when possible

Also include:
- Grocery list (derived from all meals)
- Budget feasibility summary
- Substitutions ONLY if budget is low

Return ONLY valid JSON matching the schema.
Do not add explanations outside JSON.
`;
}


  /**
   * Helper to validate inputs before processing.
   */
  static validate(input: CookingInput): string | null {
    if (input.ingredients.length < 5) return "Please provide at least 5 ingredients.";
    if (input.timeAvailable < 5) return "Cooking time must be at least 5 minutes.";
    if (!input.diet) return "Diet type is required.";
    return null;
  }
}
