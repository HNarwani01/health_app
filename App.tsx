
import React, { useState, useMemo } from 'react';
import { CookingOrchestrator, SwapRequest, SmartScheduler, generateICS } from './lib';
import { AuthScreen } from './components/Auth';
import { Calendar } from './components/Calendar';
import { TaskSidebar } from './components/TaskSidebar';
import { RecipeDetailSidebar } from './components/RecipeDetailSidebar';
import {
  CookingInput, MealPlan, DietType, KitchenSetup, DayType, UserPersona, CookingGoal, Meal, EffortLevel, ProteinLevel
} from './types';
import { Card, Heading, Text, Button, Section } from './components/ui/Layout';
import { useToast } from './components/ui/ToastContext';

// Wizard Steps
type Step = 'PERSONA' | 'PREFERENCES' | 'PANTRY' | 'LOADING' | 'RESULTS';

export default function App() {
  const { showToast } = useToast();
  const orchestrator = useMemo(() => new CookingOrchestrator(), []);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App State
  const [step, setStep] = useState<Step>('PERSONA');
  const [input, setInput] = useState<CookingInput>({
    persona: 'professional',
    goals: ['save_time'],
    diet: DietType.VEG,
    dislikes: [],
    timeAvailable: 30, 
    kitchenSetup: KitchenSetup.BASIC, 
    dayType: DayType.NORMAL,
    ingredients: [],
    days: 3,
    budgetLevel: 'medium',
    effortLevel: 'balanced', // Default
    proteinLevel: 'normal'   // Default
  });
  
  const [tempIng, setTempIng] = useState('');
  const [tempDislike, setTempDislike] = useState('');
  const [plan, setPlan] = useState<MealPlan | null>(null);

  // Interaction State
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewingMeal, setViewingMeal] = useState<{dayIndex: number, type: 'breakfast'|'lunch'|'dinner', meal: Meal} | null>(null);

  // Swap State
  const [swappingMeal, setSwappingMeal] = useState<{dayIndex: number, type: 'breakfast'|'lunch'|'dinner', meal: Meal} | null>(null);
  const [swapSelection, setSwapSelection] = useState<Record<string, { selected: boolean, replacement: string }>>({});
  const [isSwapping, setIsSwapping] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  // Calendar State
  const [calSynced, setCalSynced] = useState(false);

  // --- AUTH ---
  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // --- LOGIC: Defaults based on Persona ---
  const selectPersona = (p: UserPersona) => {
    let defaults = { ...input, persona: p };
    if (p === 'student') {
      defaults.budgetLevel = 'low';
      defaults.kitchenSetup = KitchenSetup.BASIC;
      defaults.goals = ['save_money'];
      defaults.effortLevel = 'minimal';
    } else if (p === 'professional') {
      defaults.timeAvailable = 30;
      defaults.budgetLevel = 'flexible';
      defaults.goals = ['save_time'];
      defaults.effortLevel = 'balanced';
    } else if (p === 'family') {
      defaults.kitchenSetup = KitchenSetup.FULL;
      defaults.goals = ['eat_healthy'];
      defaults.effortLevel = 'balanced';
    }
    setInput(defaults);
    setStep('PREFERENCES');
  };

  // --- LOGIC: Ingredient Locking ---
  const addIngredient = () => {
    const name = tempIng.trim().toLowerCase();
    if (!name) return;
    if (input.ingredients.find(i => i.name === name)) return;
    
    setInput(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name, locked: false }]
    }));
    setTempIng('');
  };

  const toggleLock = (index: number) => {
    const newIngs = [...input.ingredients];
    newIngs[index].locked = !newIngs[index].locked;
    setInput(prev => ({ ...prev, ingredients: newIngs }));
  };

  const addDislike = () => {
    const name = tempDislike.trim().toLowerCase();
    if (!name) return;
    if (input.dislikes.includes(name)) return;
    setInput(prev => ({ ...prev, dislikes: [...prev.dislikes, name] }));
    setTempDislike('');
  };

  // --- LOGIC: Generation ---
  const handleGenerate = async () => {
    setStep('LOADING');
    try {
      const rawPlan = await orchestrator.generatePlan(input);
      // Deterministic Refinement
      rawPlan.schedule = SmartScheduler.refineSchedule(rawPlan.schedule);
      setPlan(rawPlan);
      setStep('RESULTS');
    } catch (e: any) {
      showToast('Error generating plan. Please try again.', 'error');
      setStep('PANTRY'); // Go back
    }
  };

  // --- LOGIC: Reschedule (Feature 3 & Smart Adaptation) ---
  const handleReschedule = (id: string, newDay: number, newTime: string) => {
    if (!plan) return;
    
    // Feature 5: Smart Adaptation Logic
    // Detect if user is moving a cook task to late night (e.g., after 20:00)
    if (newTime.includes(':')) {
       const hour = parseInt(newTime.split(':')[0].replace(/[^0-9]/g, ''));
       if (hour >= 20) {
         showToast('Late night cooking detected. Suggesting "Quick Mode" for next run.', 'success');
       }
    }

    // Update local plan state instantly (UI Optimistic update)
    const updatedSchedule = plan.schedule.map(task => 
      task.id === id ? { ...task, day: newDay, timeBlock: newTime } : task
    );

    // Sort to keep order logical
    updatedSchedule.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.timeBlock.localeCompare(b.timeBlock);
    });

    setPlan({ ...plan, schedule: updatedSchedule });
    showToast('Task rescheduled!');
  };

  // --- LOGIC: Actions ---
  const openRecipe = (dayIndex: number, type: 'breakfast'|'lunch'|'dinner', meal: Meal) => {
    setViewingMeal({ dayIndex, type, meal });
  };

  const openSwap = (dayIndex: number, type: 'breakfast'|'lunch'|'dinner', meal: Meal) => {
    setSwappingMeal({ dayIndex, type, meal });
    const selection: Record<string, { selected: boolean, replacement: string }> = {};
    meal.usedIngredients.forEach(ing => {
      selection[ing] = { selected: false, replacement: '' };
    });
    setSwapSelection(selection);
  };

  const handleSwapSubmit = async () => {
    if (!swappingMeal || !plan) return;
    setIsSwapping(true);
    
    const requests: SwapRequest[] = [];
    Object.entries(swapSelection).forEach(([ing, state]) => {
      if (state.selected) {
        requests.push({
          ingredient: ing,
          replacement: state.replacement.trim() || undefined
        });
      }
    });

    if (requests.length === 0) {
      showToast('Select at least one ingredient to swap.', 'error');
      setIsSwapping(false);
      return;
    }

    try {
      const updatedMeal = await orchestrator.swapIngredient(swappingMeal.meal, requests, input);
      const newPlan = { ...plan };
      (newPlan.days[swappingMeal.dayIndex].meals as any)[swappingMeal.type] = updatedMeal;
      setPlan(newPlan);
      showToast('Ingredients swapped successfully!');
      setSwappingMeal(null);
      // If we were viewing this meal in the sidebar, update that view too
      if (viewingMeal && viewingMeal.meal.id === swappingMeal.meal.id) {
        setViewingMeal({ ...viewingMeal, meal: updatedMeal });
      }
    } catch (e) {
      showToast('Failed to swap ingredients', 'error');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleReplaceMeal = async () => {
    if (!viewingMeal || !plan) return;
    setIsReplacing(true);
    try {
      const newMeal = await orchestrator.replaceMeal(viewingMeal.meal, "Variety / Different Style", input);
      const newPlan = { ...plan };
      (newPlan.days[viewingMeal.dayIndex].meals as any)[viewingMeal.type] = newMeal;
      setPlan(newPlan);
      setViewingMeal({ ...viewingMeal, meal: newMeal }); // Update sidebar
      showToast('Meal replaced successfully!');
    } catch (e) {
       showToast('Failed to replace meal.', 'error');
    } finally {
      setIsReplacing(false);
    }
  };

  const toggleSwapSelection = (ing: string) => {
    setSwapSelection(prev => ({
      ...prev,
      [ing]: { ...prev[ing], selected: !prev[ing].selected }
    }));
  };

  const updateSwapReplacement = (ing: string, val: string) => {
    setSwapSelection(prev => ({
      ...prev,
      [ing]: { ...prev[ing], replacement: val, selected: true }
    }));
  };

  const handleSyncCalendar = () => {
    showToast('Syncing to Google Calendar...', 'success');
    setTimeout(() => {
      setCalSynced(true);
      showToast('Synced 6 events to Calendar (Simulated)', 'success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] font-sans text-slate-900 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 py-4 mb-8">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <Heading level={2} className="text-lg">QuickChef <span className="text-[#4c63d9]">Pro</span></Heading>
          <div className="text-xs font-bold text-slate-400 tracking-widest">
            {step}
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6">
        
        {/* STEP 1: PERSONA */}
        {step === 'PERSONA' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Heading level={1}>Who are you cooking for?</Heading>
            <div className="grid gap-4">
              {[
                { id: 'student', icon: '🎓', label: 'Student', desc: 'Budget focused, basic kitchen' },
                { id: 'professional', icon: '💼', label: 'Busy Pro', desc: 'Time poor, flexible budget' },
                { id: 'family', icon: '🏡', label: 'Family', desc: 'Balanced meals, full kitchen' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPersona(p.id as UserPersona)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 text-left hover:border-[#4c63d9] hover:shadow-md transition-all group"
                >
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <div className="font-bold text-lg group-hover:text-[#4c63d9]">{p.label}</div>
                  <div className="text-slate-500 text-sm">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: PREFERENCES */}
        {step === 'PREFERENCES' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Heading level={1}>Diet & Goals</Heading>
            <Card>
              <div className="space-y-6">
                
                {/* Diet Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Diet Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['veg', 'non_veg', 'vegan'].map(d => (
                      <button
                        key={d}
                        onClick={() => setInput({...input, diet: d as DietType})}
                        className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${input.diet === d ? 'bg-[#4c63d9] text-white border-[#4c63d9]' : 'bg-white text-slate-600 border-slate-200'}`}
                      >
                        {d === 'non_veg' ? 'Non-Veg' : d === 'veg' ? 'Vegetarian' : 'Vegan'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature 4: Personalisation Inputs */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cooking Effort</label>
                      <select 
                        className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                        value={input.effortLevel}
                        onChange={(e) => setInput({...input, effortLevel: e.target.value as EffortLevel})}
                      >
                        <option value="minimal">Minimal (Quick/Easy)</option>
                        <option value="balanced">Balanced</option>
                        <option value="ambitious">Ambitious (Detailed)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Protein Focus</label>
                      <select 
                        className="w-full bg-slate-50 rounded-xl p-3 text-sm"
                        value={input.proteinLevel}
                        onChange={(e) => setInput({...input, proteinLevel: e.target.value as ProteinLevel})}
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High Protein</option>
                      </select>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dislikes / Allergies</label>
                   <div className="flex gap-2 mb-2">
                    <input
                      className="flex-1 bg-slate-50 rounded-xl px-4 py-2 text-sm"
                      placeholder="e.g. Mushrooms"
                      value={tempDislike}
                      onChange={e => setTempDislike(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addDislike()}
                    />
                    <Button onClick={addDislike} className="!py-2 !px-4 text-sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {input.dislikes.map((item, i) => (
                      <span key={i} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                        {item}
                        <button onClick={() => setInput(p => ({...p, dislikes: p.dislikes.filter((_, idx) => idx !== i)}))}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Main Goal</label>
                  <select 
                    className="w-full bg-slate-50 rounded-xl p-3"
                    onChange={(e) => setInput({...input, goals: [e.target.value as CookingGoal]})}
                    value={input.goals[0]}
                  >
                    <option value="save_time">Save Time</option>
                    <option value="save_money">Save Money</option>
                    <option value="build_muscle">High Protein / Muscle</option>
                    <option value="eat_healthy">General Health</option>
                  </select>
                </div>
              </div>
            </Card>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep('PERSONA')}>Back</Button>
              <Button onClick={() => setStep('PANTRY')}>Next: Pantry</Button>
            </div>
          </div>
        )}

        {/* STEP 3: PANTRY */}
        {step === 'PANTRY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Heading level={1}>What's in your kitchen?</Heading>
            <Text>Tap the lock 🔒 to force the AI to use an ingredient.</Text>
            
            <Card>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 bg-slate-50 rounded-xl px-4 py-3"
                  placeholder="e.g. Chicken Breast"
                  value={tempIng}
                  onChange={e => setTempIng(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addIngredient()}
                />
                <Button onClick={addIngredient}>Add</Button>
              </div>
              
              <div className="space-y-2">
                {input.ingredients.length === 0 && <div className="text-center text-slate-400 py-4">Pantry empty</div>}
                {input.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium">{ing.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleLock(i)}
                        className={`p-2 rounded-lg transition-colors ${ing.locked ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:text-slate-500'}`}
                        title="Lock ingredient"
                      >
                        {ing.locked ? '🔒 Locked' : '🔓 Optional'}
                      </button>
                      <button 
                         onClick={() => setInput(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, idx) => idx !== i) }))}
                         className="text-slate-400 hover:text-red-500 px-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep('PREFERENCES')}>Back</Button>
              <Button onClick={handleGenerate} disabled={input.ingredients.length < 3}>
                {input.ingredients.length < 3 ? 'Add 3+ Items' : 'Generate Plan'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: LOADING */}
        {step === 'LOADING' && (
          <div className="text-center py-20 animate-pulse">
            <div className="text-6xl mb-4">🍳</div>
            <Heading level={2}>Chef is thinking...</Heading>
            <Text>Designing recipes for your {input.persona} lifestyle.</Text>
          </div>
        )}

        {/* STEP 5: RESULTS */}
        {step === 'RESULTS' && plan && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center">
              <Heading level={1}>Your Plan</Heading>
              <div className="flex gap-2">
                <Button 
                   variant={calSynced ? "secondary" : "primary"} 
                   onClick={handleSyncCalendar}
                   disabled={calSynced}
                >
                  {calSynced ? '✅ Synced' : 'Sync G-Cal'}
                </Button>
                <Button variant="secondary" onClick={() => setStep('PERSONA')}>Start Over</Button>
              </div>
            </div>

            {/* Feature 1: Interactive Calendar View */}
            <Section title="📅 Interactive Schedule">
               <Text variant="muted" className="mb-2">Click on a day to view or reschedule tasks.</Text>
               <Calendar 
                 schedule={plan.schedule} 
                 onSelectDay={setSelectedDay}
                 totalDays={7} // Always show a week view
               />
            </Section>

            {/* Meals */}
            {plan.days.map((day, dIdx) => (
              <div key={day.day} className="space-y-4">
                <Heading level={3} className="text-slate-400 uppercase tracking-widest text-xs">Day {day.day}</Heading>
                {['breakfast', 'lunch', 'dinner'].map((type) => {
                  const meal = (day.meals as any)[type] as Meal;
                  return (
                    <Card key={type}>
                      <div className="flex justify-between mb-2">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-bold uppercase text-[#4c63d9]">{type}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{meal.cookingMethod}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                           <span className="text-xs font-bold text-slate-500">{meal.nutrition.caloriesRange}</span>
                        </div>
                      </div>
                      
                      <Heading level={2} className="text-lg mb-1">{meal.name}</Heading>
                      <Text variant="muted" className="mb-3">{meal.description}</Text>
                      
                      <div className="flex gap-4 mb-4 text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded-lg">
                        <span>⏳ Prep: {meal.prepTimeMinutes}m</span>
                        <span>🍳 Cook: {meal.cookingTimeMinutes}m</span>
                      </div>
                      
                      {/* Feature 1: View Full Recipe Action */}
                      <Button 
                        variant="secondary" 
                        className="w-full !text-xs" 
                        onClick={() => openRecipe(dIdx, type as any, meal)}
                      >
                        View Full Recipe & Options
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ))}

            {/* Smart Grocery List */}
            <Card>
              <Section title="🛒 Organized Grocery List">
                {['produce', 'protein', 'pantry', 'dairy', 'grains', 'other'].map(cat => {
                   const items = plan.groceryList.filter(g => g.category === cat && g.needed);
                   const haveItems = plan.groceryList.filter(g => g.category === cat && !g.needed);
                   
                   if (items.length === 0 && haveItems.length === 0) return null;
                   
                   return (
                     <div key={cat} className="mb-4 last:mb-0">
                       <div className="text-xs font-bold uppercase text-slate-400 mb-2">{cat}</div>
                       <div className="flex flex-wrap gap-2">
                         {items.map((item, i) => (
                           <span key={i} className="bg-red-50 border border-red-100 px-3 py-1 rounded-lg text-sm text-red-700 font-medium">
                             {item.ingredient}
                           </span>
                         ))}
                         {haveItems.map((item, i) => (
                           <span key={`have-${i}`} className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg text-sm text-slate-400 line-through decoration-slate-300">
                             {item.ingredient}
                           </span>
                         ))}
                       </div>
                     </div>
                   );
                })}
              </Section>
            </Card>
          </div>
        )}
        
        {/* Task Sidebar (Slide-over) */}
        <TaskSidebar 
          isOpen={selectedDay !== null}
          onClose={() => setSelectedDay(null)}
          day={selectedDay}
          tasks={selectedDay ? plan?.schedule.filter(s => s.day === selectedDay) || [] : []}
          onReschedule={handleReschedule}
        />

        {/* Feature 1: Dedicated Recipe Sidebar */}
        <RecipeDetailSidebar 
          meal={viewingMeal?.meal || null}
          onClose={() => setViewingMeal(null)}
          onSwapIngredients={() => {
             if (viewingMeal) {
               openSwap(viewingMeal.dayIndex, viewingMeal.type, viewingMeal.meal);
               setViewingMeal(null); // Close recipe view to show swap view
             }
          }}
          onReplaceMeal={handleReplaceMeal}
        />

        {/* SWAP MODAL */}
        {swappingMeal && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
             <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Heading level={2}>Modify Meal</Heading>
                    <Text variant="muted">{swappingMeal.meal.name}</Text>
                  </div>
                  <button onClick={() => setSwappingMeal(null)} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="space-y-4 mb-6">
                   <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl">
                     <strong>Tip:</strong> Select items to swap. Leave input empty to let AI find the best substitute.
                   </div>
                   
                   <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                      <div className="grid grid-cols-[auto_1fr_1fr] gap-4 text-xs font-bold uppercase text-slate-400 mb-1 px-1">
                        <div>Swap</div>
                        <div>Original</div>
                        <div>Replacement</div>
                      </div>
                      {swappingMeal.meal.usedIngredients.map((ing, i) => {
                         const state = swapSelection[ing] || { selected: false, replacement: '' };
                         return (
                           <div key={i} className={`grid grid-cols-[auto_1fr_1fr] gap-4 items-center p-2 rounded-lg transition-colors ${state.selected ? 'bg-white shadow-sm' : ''}`}>
                             <input 
                               type="checkbox" 
                               checked={state.selected}
                               onChange={() => toggleSwapSelection(ing)}
                               className="w-4 h-4 rounded text-[#4c63d9]"
                             />
                             <div className={`text-sm font-medium ${state.selected ? 'text-slate-900' : 'text-slate-500'}`}>{ing}</div>
                             <input 
                               className={`border rounded-lg px-3 py-1.5 text-sm transition-all ${state.selected ? 'border-[#4c63d9] bg-white' : 'border-slate-200 bg-slate-100'}`}
                               placeholder={state.selected ? "Empty = Auto" : "-"}
                               value={state.replacement}
                               onChange={(e) => updateSwapReplacement(ing, e.target.value)}
                               disabled={!state.selected}
                             />
                           </div>
                         );
                      })}
                   </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                   <Button variant="secondary" onClick={() => setSwappingMeal(null)}>Cancel</Button>
                   <Button onClick={handleSwapSubmit} disabled={isSwapping}>
                     {isSwapping ? 'Chef is working...' : 'Apply Swaps'}
                   </Button>
                </div>
             </div>
           </div>
        )}

        {/* Global Loading Overlay for Meal Replacement */}
        {isReplacing && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center flex-col text-white">
              <div className="text-4xl animate-bounce mb-4">⚡</div>
              <div className="font-bold text-xl">Chef is redesigning your meal...</div>
           </div>
        )}

      </main>
    </div>
  );
}
