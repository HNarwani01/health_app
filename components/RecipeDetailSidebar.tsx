
import React from 'react';
import { Meal } from '../types';
import { Heading, Text, Button } from './ui/Layout';

interface RecipeDetailProps {
  meal: Meal | null;
  onClose: () => void;
  onSwapIngredients: () => void;
  onReplaceMeal: () => void;
}

export const RecipeDetailSidebar: React.FC<RecipeDetailProps> = ({ 
  meal, 
  onClose, 
  onSwapIngredients, 
  onReplaceMeal 
}) => {
  if (!meal) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#4c63d9] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {meal.cookingMethod}
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase">
                {meal.nutrition.caloriesRange}
              </span>
            </div>
            <Heading level={2} className="text-2xl leading-tight">{meal.name}</Heading>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 text-xl">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 flex-1">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Prep Time</div>
              <div className="font-bold text-slate-700">{meal.prepTimeMinutes} mins</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Cook Time</div>
              <div className="font-bold text-slate-700">{meal.cookingTimeMinutes} mins</div>
            </div>
          </div>

          {/* Description */}
          <Text>{meal.description}</Text>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 !text-xs" onClick={onSwapIngredients}>
              🔄 Swap Ingredients
            </Button>
            <Button variant="secondary" className="flex-1 !text-xs !text-red-600 hover:!bg-red-50 hover:!border-red-100" onClick={onReplaceMeal}>
              ⚡ Replace Meal
            </Button>
          </div>

          {/* Ingredients */}
          <div>
            <Heading level={3} className="mb-3">Ingredients</Heading>
            <ul className="grid grid-cols-2 gap-2">
              {meal.usedIngredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4c63d9]"></span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment & Alternatives */}
          <div>
             <Heading level={3} className="mb-3">Equipment</Heading>
             <div className="text-sm text-slate-600 mb-2">
               <strong>Primary:</strong> {meal.cookingMethod}
             </div>
             {meal.equipmentAlternatives && meal.equipmentAlternatives.length > 0 && (
               <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded-lg">
                 <strong>Alternatives:</strong> {meal.equipmentAlternatives.join(', ')}
               </div>
             )}
          </div>

          {/* Steps */}
          <div>
            <Heading level={3} className="mb-3">Instructions</Heading>
            
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Prep Checklist</div>
              <ul className="space-y-2">
                 {meal.prepChecklist.washing.map((s, i) => <li key={`w-${i}`} className="text-sm text-slate-600 flex gap-2"><span>💧</span> {s}</li>)}
                 {meal.prepChecklist.chopping.map((s, i) => <li key={`c-${i}`} className="text-sm text-slate-600 flex gap-2"><span>🔪</span> {s}</li>)}
              </ul>
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Cooking Steps</div>
            <ol className="space-y-4 relative border-l-2 border-slate-100 ml-3">
              {(meal.stepByStepRecipe || meal.cookingSequence).map((step, i) => (
                <li key={i} className="pl-6 relative">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#4c63d9]"></span>
                  <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition & Leftovers */}
          <div className="bg-[#4c63d9]/5 p-4 rounded-xl space-y-2">
             <div className="flex justify-between text-sm">
               <span className="text-slate-500">Protein</span>
               <span className="font-bold text-[#4c63d9]">{meal.nutrition.proteinRange}</span>
             </div>
             {meal.leftoverStrategy && (
               <div className="pt-2 border-t border-[#4c63d9]/10 text-xs text-slate-600">
                 <strong>🥡 Leftover Tip:</strong> {meal.leftoverStrategy}
               </div>
             )}
          </div>

        </div>
      </div>
    </>
  );
};
