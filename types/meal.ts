
export interface Nutrition {
  caloriesRange: string;
  proteinRange: string;
}

export interface PrepChecklist {
  washing: string[];
  chopping: string[];
  marinating: string[];
}

export interface Meal {
  id: string; // Unique ID for swap targeting
  name: string;
  description: string;
  cookingMethod: string; // e.g., "Pressure Cooker", "Stovetop"
  equipmentAlternatives?: string[]; // e.g. ["Use heavy bottom pan if no pressure cooker"]
  prepTimeMinutes: number;
  cookingTimeMinutes: number;
  todoList: string[]; // 8-12 items
  stepByStepRecipe: string[]; // 6-10 clear steps (Feature 1)
  prepChecklist: PrepChecklist;
  cookingSequence: string[]; // Legacy/Time-aware flow
  usedIngredients: string[]; // Ingredients with quantities
  nutrition: Nutrition;
  leftoverStrategy?: string; // e.g., "Store in airtight container for lunch"
  swapOptions?: string[]; // e.g., ["Tofu scramble instead of Paneer"]
}
