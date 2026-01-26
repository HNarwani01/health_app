
import { MealPlan, ScheduleItem } from "../types";

export class SmartScheduler {
  /**
   * Refines the AI-generated schedule with deterministic reminders based on user preferences.
   */
  static refineSchedule(
    aiSchedule: ScheduleItem[], 
    startHour: number = 18 // Default cooking start time: 6 PM
  ): ScheduleItem[] {
    const refined = [...aiSchedule];

    // 1. Add precise timestamps to cooking blocks
    refined.forEach(item => {
      if (item.type === 'cook') {
        const hour = startHour; // Simplified: assume all dinners are at startHour
        item.timeBlock = `Day ${item.day} @ ${hour}:00`;
      }
    });

    // 2. Add a "Defrost/Prep" reminder for the night before if needed
    // This looks for long cooking durations or marinating steps
    // (Logic simplified for prototype)
    
    // 3. Sort chronologically
    return refined.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      // Heuristic sort for items within the same day
      const typeOrder = { 'shop': 0, 'prep': 1, 'cook': 2 };
      return (typeOrder[a.type as keyof typeof typeOrder] || 0) - (typeOrder[b.type as keyof typeof typeOrder] || 0);
    });
  }
}
