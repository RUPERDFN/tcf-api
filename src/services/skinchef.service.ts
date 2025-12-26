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

interface MealItem {
  name: string;
  ingredients: string[];
  instructions: string;
  prepTime: number;
  calories: number;
}

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
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

    return await response.json();
  } catch (error) {
    console.error('SkinChef service error:', error);
    throw new Error('Error generando menú con IA');
  }
}

export async function swapMeal(menuId: number, dayIndex: number, mealType: string, preferences: any): Promise<MealItem> {
  try {
    const response = await fetch(`${env.SKINCHEF_URL}/api/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId, dayIndex, mealType, preferences })
    });

    if (!response.ok) {
      throw new Error(`SkinChef swap error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('SkinChef swap error:', error);
    throw new Error('Error intercambiando comida');
  }
}
