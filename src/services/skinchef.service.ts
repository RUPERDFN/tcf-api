import { env } from '../config/env.js';

export interface MenuGenerationRequest {
  userId: number;
  budget: number;
  diners: number;
  mealsPerDay: number;
  daysPerWeek: number;
  dietType: string;
  allergies: string[];
  dislikes: string[];
  pantryItems: string[];
}

export interface GeneratedMenu {
  days: Array<{
    date: string;
    meals: {
      breakfast?: MealItem;
      lunch?: MealItem;
      dinner?: MealItem;
    };
  }>;
  shoppingList: ShoppingItem[];
  estimatedCost: number;
}

export interface MealItem {
  name: string;
  ingredients: string[];
  instructions: string;
  prepTime: number;
  calories: number;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
}

export interface Recipe {
  name: string;
  ingredients: Array<{ name: string; quantity: string }>;
  steps: string[];
  time_min: number;
}

export async function generateMenu(request: MenuGenerationRequest): Promise<GeneratedMenu> {
  try {
    const response = await fetch(`${env.SKINCHEF_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`SkinChef error: ${response.status}`);
    }

    return await response.json() as GeneratedMenu;
  } catch (error) {
    console.error('SkinChef service error:', error);
    throw new Error('Error generando menú con IA');
  }
}

export async function swapMeal(
  currentMeal: MealItem,
  preferences: { dietType?: string; allergies?: string[]; dislikes?: string[] }
): Promise<{ meal: MealItem; shoppingListChanges: { added: ShoppingItem[]; removed: ShoppingItem[] } }> {
  try {
    const response = await fetch(`${env.SKINCHEF_URL}/api/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentMeal, preferences })
    });

    if (!response.ok) {
      throw new Error(`SkinChef swap error: ${response.status}`);
    }

    return await response.json() as { meal: MealItem; shoppingListChanges: { added: ShoppingItem[]; removed: ShoppingItem[] } };
  } catch (error) {
    console.error('SkinChef swap error:', error);
    throw new Error('Error intercambiando comida');
  }
}

export async function getRecipe(mealName: string): Promise<Recipe> {
  try {
    const response = await fetch(`${env.SKINCHEF_URL}/api/recipe?name=${encodeURIComponent(mealName)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`SkinChef recipe error: ${response.status}`);
    }

    return await response.json() as Recipe;
  } catch (error) {
    console.error('SkinChef recipe error:', error);
    throw new Error('Error obteniendo receta');
  }
}
