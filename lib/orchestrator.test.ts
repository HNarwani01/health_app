
/**
 * Note: In a production environment, use a test runner like Vitest or Jest.
 * This file demonstrates an integration test for the CookingOrchestrator.
 */

import { CookingOrchestrator } from './orchestrator';
import { DietType, KitchenSetup, DayType } from '../types';

export async function runOrchestratorTest() {
  console.log('--- STARTING ORCHESTRATOR INTEGRATION TEST ---');
  
  const orchestrator = new CookingOrchestrator();

  // Test Case 1: Invalid Input (too few ingredients)
  const invalidInput: any = {
    diet: DietType.VEG,
    timeAvailable: 30,
    kitchenSetup: KitchenSetup.BASIC,
    dayType: DayType.NORMAL,
    ingredients: ['salt', 'pepper'], // Only 2 items
    days: 1,
    budgetLevel: 'medium'
  };

  try {
    await orchestrator.generatePlan(invalidInput);
    console.error('FAIL: Orchestrator should have thrown an error for < 5 ingredients.');
  } catch (e) {
    console.log('PASS: Validation caught insufficient ingredients.');
  }

  // Test Case 2: Validation of centralized check
  const errors = CookingOrchestrator.validateInput(invalidInput);
  if (errors.length > 0) {
    console.log('PASS: static validateInput caught errors:', errors);
  } else {
    console.error('FAIL: static validateInput missed errors.');
  }

  console.log('--- INTEGRATION TEST COMPLETE ---');
}
