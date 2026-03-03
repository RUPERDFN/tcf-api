/**
 * macros.service.ts
 * 
 * Auto-Macros Engine for TheCookFlow Pro.
 * 
 * Strategy:
 * 1. Try to find the recipe in recipes table by name (title match).
 * 2. If found, return stored macros JSON (pre-computed or AI-seeded).
 * 3. If not found, use the SkinChef AI nutrition estimate endpoint as fallback.
 * 4. Aggregate macros across all meals in a menu day to return daily totals.
 */

import { db } from '../config/database.js';
import { recipes, recipeIngredients, ingredients } from '../../drizzle/schema.js';
import { eq, ilike } from 'drizzle-orm';
import skinChefService from './skinchef.service.js';

export interface MacroNutrients {
    calories: number;
    protein: number;  // grams
    carbs: number;    // grams
    fat: number;      // grams
    fiber?: number;   // grams (optional)
}

export interface DailyMacros {
    date: string;
    meals: {
        breakfast?: MacroNutrients;
        lunch?: MacroNutrients;
        dinner?: MacroNutrients;
    };
    totals: MacroNutrients;
}

export interface MenuMacroReport {
    days: DailyMacros[];
    weeklyAverage: MacroNutrients;
}

/**
 * Try to get macros for a single meal by name.
 * First checks DB, falls back to SkinChef AI estimate.
 */
async function getMacrosForMeal(
    mealName: string,
    ingredientsList: string[] = []
): Promise<MacroNutrients> {
    // 1. Look up by name in the recipes table (case-insensitive)
    const [recipe] = await db
        .select({ macros: recipes.macros })
        .from(recipes)
        .where(ilike(recipes.title, `%${mealName}%`))
        .limit(1);

    if (recipe?.macros) {
        const stored = recipe.macros as Partial<MacroNutrients>;
        return {
            calories: stored.calories ?? 0,
            protein: stored.protein ?? 0,
            carbs: stored.carbs ?? 0,
            fat: stored.fat ?? 0,
            fiber: stored.fiber,
        };
    }

    // 2. Fallback: SkinChef AI nutrition estimate
    try {
        const estimate = await skinChefService.estimateNutrition(mealName, ingredientsList);
        return {
            calories: estimate.calories,
            protein: estimate.protein,
            carbs: estimate.carbs,
            fat: estimate.fat,
            fiber: estimate.fiber,
        };
    } catch {
        // If the AI service is unavailable, return zero macros — never crash
        console.warn(`[Macros] Could not estimate macros for "${mealName}", returning zeros.`);
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
}

function sumMacros(a: MacroNutrients, b: MacroNutrients): MacroNutrients {
    return {
        calories: a.calories + b.calories,
        protein: a.protein + b.protein,
        carbs: a.carbs + b.carbs,
        fat: a.fat + b.fat,
        fiber: (a.fiber ?? 0) + (b.fiber ?? 0),
    };
}

const ZERO_MACROS: MacroNutrients = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

function averageMacros(total: MacroNutrients, count: number): MacroNutrients {
    if (count === 0) return ZERO_MACROS;
    return {
        calories: Math.round(total.calories / count),
        protein: Math.round((total.protein / count) * 10) / 10,
        carbs: Math.round((total.carbs / count) * 10) / 10,
        fat: Math.round((total.fat / count) * 10) / 10,
        fiber: Math.round(((total.fiber ?? 0) / count) * 10) / 10,
    };
}

/**
 * Compute macros for every day/meal in a stored menuData JSON array.
 * menuData follows the GeneratedMenu.days structure from skinchef.service.ts
 */
export async function computeMenuMacros(menuData: any[]): Promise<MenuMacroReport> {
    const days: DailyMacros[] = [];
    let weeklyTotal = { ...ZERO_MACROS };

    for (const day of menuData) {
        const date: string = day.date || '';
        const mealTypes = ['breakfast', 'lunch', 'dinner'] as const;

        const dayResult: DailyMacros = {
            date,
            meals: {},
            totals: { ...ZERO_MACROS },
        };

        for (const mealType of mealTypes) {
            const meal = day?.meals?.[mealType];
            if (!meal?.name) continue;

            const macros = await getMacrosForMeal(meal.name, meal.ingredients || []);
            dayResult.meals[mealType] = macros;
            dayResult.totals = sumMacros(dayResult.totals, macros);
        }

        // Round day totals
        dayResult.totals = {
            calories: Math.round(dayResult.totals.calories),
            protein: Math.round(dayResult.totals.protein * 10) / 10,
            carbs: Math.round(dayResult.totals.carbs * 10) / 10,
            fat: Math.round(dayResult.totals.fat * 10) / 10,
            fiber: Math.round((dayResult.totals.fiber ?? 0) * 10) / 10,
        };

        weeklyTotal = sumMacros(weeklyTotal, dayResult.totals);
        days.push(dayResult);
    }

    return {
        days,
        weeklyAverage: averageMacros(weeklyTotal, days.length),
    };
}
