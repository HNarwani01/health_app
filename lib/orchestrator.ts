
import { GoogleGenAI, Type } from "@google/genai";
import { CookingInput, MealPlan, EnhancementSuggestion, Meal } from "../types";
import { PlanCache } from "./cache";

export interface SwapRequest {
  ingredient: string;
  replacement?: string; // If empty/undefined, AI chooses best substitute
}

export class CookingOrchestrator {
  // Active requests map handles concurrency (Coordination/Deduplication)
  private static activeRequests = new Map<string, Promise<MealPlan>>();

  static validateInput(input: CookingInput): string[] {
    const errors: string[] = [];
    if (input.ingredients.length < 3) errors.push("Add at least 3 ingredients.");
    return errors;
  }

  async generatePlan(input: CookingInput): Promise<MealPlan> {
    // 1. Check Cache
    const cachedPlan = PlanCache.get(input);
    if (cachedPlan) return cachedPlan;

    // 2. Check for ongoing identical request (Request Deduplication)
    const key = PlanCache.generateKey(input);
    if (CookingOrchestrator.activeRequests.has(key)) {
      return CookingOrchestrator.activeRequests.get(key)!;
    }

    // 3. Coordinate AI Call
    const requestPromise = this.executeAiCall(input);
    CookingOrchestrator.activeRequests.set(key, requestPromise);

    try {
      const plan = await requestPromise;
      // 4. Update Cache on success
      PlanCache.set(input, plan);
      return plan;
    } finally {
      CookingOrchestrator.activeRequests.delete(key);
    }
  }

  /**
   * Replaces a specific meal with a new one based on criteria.
   */
  async replaceMeal(oldMeal: Meal, criteria: string, input: CookingInput): Promise<Meal> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Replace this recipe with a DIFFERENT one.
      Original Meal: ${oldMeal.name} (${oldMeal.description})
      
      Replacement Criteria: "${criteria}"
      
      Constraints:
      - Diet: ${input.diet}
      - Kitchen: ${input.kitchenSetup}
      - Effort: ${input.effortLevel}
      - Protein: ${input.proteinLevel}
      
      Output:
      - Fully updated JSON for the single Meal object.
      - Maintain strict schema.
      - Generate a NEW unique ID.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: this.getMealSchema()
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI response empty.");
    return JSON.parse(text) as Meal;
  }

  /**
   * Swaps ingredients in a specific meal and regenerates it.
   */
  async swapIngredient(originalMeal: Meal, swaps: SwapRequest[], input: CookingInput): Promise<Meal> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const swapInstructions = swaps.map(s => {
      if (s.replacement && s.replacement.trim()) {
        return `- Replace "${s.ingredient}" with "${s.replacement}"`;
      } else {
        return `- Replace "${s.ingredient}" with the BEST SUBSTITUTE fitting the diet (${input.diet}) and budget (${input.budgetLevel}).`;
      }
    }).join('\n');

    const prompt = `
      Modify this recipe based on user swaps.
      Original Recipe: ${JSON.stringify(originalMeal)}
      
      User Swaps:
      ${swapInstructions}
      
      Constraints:
      - Diet: ${input.diet}
      - Kitchen: ${input.kitchenSetup}
      - Pantry: ${input.ingredients.map(i => i.name).join(', ')}
      
      Output:
      - Fully updated JSON for the single Meal object.
      - Recalculate nutrition, stepByStepRecipe, and ingredient quantities.
      - Keep ID same as original: "${originalMeal.id}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: this.getMealSchema()
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI response empty.");
    return JSON.parse(text) as Meal;
  }

  private async executeAiCall(input: CookingInput): Promise<MealPlan> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: this.buildPrompt(input),
        config: {
          systemInstruction: `You are a smart cooking assistant for a ${input.persona}. 
          Constraint: Kitchen Setup is ${input.kitchenSetup}. 
          Rules: 
          - If setup is 'basic', NO OVEN, NO AIR FRYER. Use pressure cooker or stovetop.
          - Respect Budget: ${input.budgetLevel}.
          - Effort Level: ${input.effortLevel}.
          - Protein Preference: ${input.proteinLevel}.
          - Goal: ${input.goals.join(', ')}.`,
          responseMimeType: "application/json",
          responseSchema: this.getPlanSchema()
        }
      });

      const text = response.text;
      if (!text) throw new Error("AI response empty.");
      
      return JSON.parse(text) as MealPlan;
    } catch (error) {
      console.error("Orchestrator Error:", error);
      throw new Error("Could not generate plan.");
    }
  }

  async enhancePlan(plan: MealPlan, input: CookingInput): Promise<EnhancementSuggestion[]> {
     return [];
  }

  private buildPrompt(input: CookingInput): string {
    const lockedIngredients = input.ingredients.filter(i => i.locked).map(i => i.name).join(', ');
    const otherIngredients = input.ingredients.filter(i => !i.locked).map(i => i.name).join(', ');

    return `
      Generate a ${input.days}-day meal plan.
      
      CONTEXT:
      - Persona: ${input.persona}
      - Diet: ${input.diet}
      - Dislikes: ${input.dislikes.join(', ') || 'None'}
      - Time/Meal: ${input.timeAvailable}m
      - Effort: ${input.effortLevel} (adjust complexity accordingly)
      - Protein: ${input.proteinLevel}
      
      PANTRY RULES:
      1. MUST USE (Locked): ${lockedIngredients || 'None'}
      2. Available: ${otherIngredients}
      
      OUTPUT REQUIREMENTS:
      - Detailed step-by-step recipes (6-10 steps).
      - Cooking methods MUST match kitchen setup (${input.kitchenSetup}).
      - Group grocery items by category.
      - Include schedule (shop/prep/cook) optimization.
    `;
  }

  private getPlanSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        days: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.NUMBER },
              meals: {
                type: Type.OBJECT,
                properties: {
                  breakfast: this.getMealSchema(),
                  lunch: this.getMealSchema(),
                  dinner: this.getMealSchema()
                },
                required: ['breakfast', 'lunch', 'dinner']
              }
            },
            required: ['day', 'meals']
          }
        },
        groceryList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ingredient: { type: Type.STRING },
              needed: { type: Type.BOOLEAN, description: "True if not in pantry, False if user already has it" },
              usedInMeals: { type: Type.NUMBER },
              category: { type: Type.STRING, enum: ['produce', 'protein', 'pantry', 'dairy', 'grains', 'other'] }
            },
            required: ['ingredient', 'needed', 'usedInMeals', 'category']
          }
        },
        schedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['shop', 'prep', 'cook'] },
              day: { type: Type.NUMBER },
              timeBlock: { type: Type.STRING },
              description: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER }
            },
            required: ['id', 'type', 'day', 'timeBlock', 'description', 'durationMinutes']
          }
        },
        substitutions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              substitute: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ['original', 'substitute', 'reason']
          }
        },
        budgetSummary: {
           type: Type.OBJECT,
           properties: {
             level: { type: Type.STRING },
             verdict: { type: Type.STRING },
             strategy: { type: Type.ARRAY, items: { type: Type.STRING } }
           },
           required: ['level', 'verdict', 'strategy']
        },
        nutritionSummary: {
           type: Type.OBJECT,
           properties: {
             perDay: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   day: { type: Type.NUMBER },
                   caloriesRange: { type: Type.STRING },
                   proteinRange: { type: Type.STRING }
                 },
                 required: ['day', 'caloriesRange', 'proteinRange']
               }
             }
           },
           required: ['perDay']
        }
      },
      required: ['days', 'groceryList', 'schedule', 'substitutions', 'budgetSummary', 'nutritionSummary']
    };
  }

  private getMealSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "Unique ID for this meal instance" },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        cookingMethod: { type: Type.STRING, description: "e.g., Pan fry, Pressure cooker. NO OVEN for basic setup." },
        equipmentAlternatives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Alternative tools if main tool unavailable" },
        prepTimeMinutes: { type: Type.NUMBER },
        cookingTimeMinutes: { type: Type.NUMBER },
        todoList: { type: Type.ARRAY, items: { type: Type.STRING } },
        stepByStepRecipe: { type: Type.ARRAY, items: { type: Type.STRING }, description: "6-10 clear cooking steps" },
        prepChecklist: {
          type: Type.OBJECT,
          properties: {
            washing: { type: Type.ARRAY, items: { type: Type.STRING } },
            chopping: { type: Type.ARRAY, items: { type: Type.STRING } },
            marinating: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['washing', 'chopping', 'marinating']
        },
        cookingSequence: { type: Type.ARRAY, items: { type: Type.STRING } },
        usedIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        nutrition: {
          type: Type.OBJECT,
          properties: {
            caloriesRange: { type: Type.STRING },
            proteinRange: { type: Type.STRING }
          },
          required: ['caloriesRange', 'proteinRange']
        },
        leftoverStrategy: { type: Type.STRING },
        swapOptions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['id', 'name', 'description', 'cookingMethod', 'prepTimeMinutes', 'cookingTimeMinutes', 'todoList', 'stepByStepRecipe', 'prepChecklist', 'cookingSequence', 'usedIngredients', 'nutrition']
    };
  }
}
