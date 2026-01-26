
# QuickChef Pro 🍳

QuickChef Pro is an intelligent, AI-powered meal planning prototype designed to adapt to your lifestyle, kitchen setup, and dietary goals. Built with React, TypeScript, and the Google Gemini API, it generates personalized meal plans, grocery lists, and cooking schedules.

## ✨ Features

- **AI-Driven Personalization**: Generates meal plans based on persona (Student, Professional, Family), diet, and fitness goals.
- **Smart Pantry Management**: Input current ingredients and "lock" specific items to ensure they are used in the generated recipes.
- **Dynamic Scheduling**: Creates a realistic cooking schedule (shop, prep, cook) optimized for your energy levels.
- **Interactive Calendar**: Drag-and-drop style view to manage your cooking week (Simulated).
- **Recipe Customization**: 
  - **Swap Ingredients**: replace specific items in a recipe.
  - **Replace Meal**: Regenerate an entire meal if it doesn't fit your taste.
- **Performance Optimized**: Built-in caching layer to reduce API calls and improve responsiveness.

## 🚀 Getting Started

### Prerequisites

1.  **Google Gemini API Key**: You need a valid API key from Google AI Studio.
2.  **Environment**: A runtime environment that supports React and `process.env` injection (e.g., standard bundlers like Vite/Webpack, or Cloud IDEs).

### API Configuration

This application relies exclusively on the **Google GenAI SDK** (`@google/genai`).

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Create a new API Key.
3.  Configure your environment variable:
    *   **Variable Name**: `API_KEY`
    *   **Value**: `your_api_key_here`

> **Note**: The application accesses this key via `process.env.API_KEY`. Ensure this is set in your build configuration or `.env` file (e.g., `REACT_APP_API_KEY` or `VITE_API_KEY` depending on your build tool, though the code assumes direct `process.env.API_KEY` access).

## 🛠️ Architecture & Code Structure

The project follows a clean, modular architecture separating concerns between UI, business logic, and data management.

### `/lib` (Core Logic)

*   **`orchestrator.ts`**: The brain of the application. It coordinates requests to the Gemini API, handles prompt engineering, and enforces strict JSON schemas for AI responses.
*   **`cache.ts`**: An in-memory caching layer. It hashes user inputs (diet, ingredients, goals) to create deterministic keys, preventing redundant API calls for identical requests.
*   **`scheduler.ts`**: refined logic to organize AI output into a chronological timeline, adding heuristics for prep time and reminders.
*   **`calendar.ts`**: Utilities for generating calendar events (ICS format) for external sync.

### `/types` (Domain Models)

Strongly typed interfaces using TypeScript to ensure data consistency across the app.

*   **`input.ts`**: Definitions for user preferences (Effort Level, Protein Focus, Kitchen Setup).
*   **`meal.ts`**: Structure for Recipe data, including nutrition, steps, and equipment.
*   **`plan.ts`**: The aggregate structure containing days, grocery lists, and schedules.

### `/components` (UI)

*   **`RecipeDetailSidebar`**: A complex component handling the display of deep recipe details and substitution actions.
*   **`TaskSidebar`**: Manages the daily schedule view.
*   **`Auth`**: Handles the mock authentication flow.

## 🧩 Usage Flow

1.  **Persona Selection**: Choose a profile (e.g., "Busy Professional") to pre-fill sensible defaults.
2.  **Preferences**: Fine-tune diet (Veg/Vegan), cooking effort (Minimal/Ambitious), and goals.
3.  **Pantry**: Add ingredients you have on hand. Toggle the 🔒 icon to force the AI to include them.
4.  **Generation**: The Orchestrator calls Gemini to build the plan.
5.  **Refinement**: 
    *   Click on any meal to view full details.
    *   Use **"Swap Ingredients"** to adjust specific items.
    *   Use **"Replace Meal"** to get a completely new suggestion for that slot.

## 🛡️ Security & Privacy

*   **State Management**: All data is held in-memory for this prototype; no sensitive data is persisted to local storage.
*   **Input Validation**: All user inputs are sanitized before being sent to the LLM to prevent prompt injection.
*   **API Safety**: The backend orchestrator handles the API communication; client-side rate limiting is simulated.

---

*Built for the Google AI Studio Challenge.*
