import { env } from '../config/env.js';

const BASE_URL = env.SKINCHEF_URL || 'http://localhost:8000';
const TIMEOUT_MS = 30000;

export class SkinchefError extends Error {
  public statusCode: number;
  public endpoint: string;
  public isRetryable: boolean;

  constructor(message: string, statusCode: number = 500, endpoint: string = '', isRetryable: boolean = false) {
    super(message);
    this.name = 'SkinchefError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.isRetryable = isRetryable;
  }
}

export interface UserProfile {
  budget: number;
  diners: number;
  mealsPerDay: number;
  dietType: string;
  allergies: string[];
  dislikes: string[];
  pantryItems: string[];
  preferenceVector?: Record<string, number>; // AI learned taste preferences
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

export interface Substitution {
  name: string;
  reason: string;
  isHealthy: boolean;
  nutritionComparison?: string;
}

export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export interface DailyTip {
  tip: string;
  category: string;
}

class SkinChefService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    retries = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    console.log(`[SkinChef] ${options.method || 'GET'} ${endpoint}`);
    const start = Date.now();

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeout);

      const latency = Date.now() - start;
      console.log(`[SkinChef] Response: ${response.status} (${latency}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new SkinchefError(
          `Error del servicio de IA: ${errorText}`,
          response.status,
          endpoint,
          response.status >= 500
        );
      }

      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeout);

      if (error instanceof SkinchefError) {
        throw error;
      }

      if (error.name === 'AbortError' && retries > 0) {
        console.log(`[SkinChef] Timeout, reintentando... (${retries} restantes)`);
        return this.fetchWithRetry<T>(endpoint, options, retries - 1);
      }

      if (error.name === 'AbortError') {
        throw new SkinchefError('Tiempo de espera agotado al conectar con el servicio de IA', 408, endpoint, true);
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new SkinchefError('No se puede conectar con el servicio de IA', 503, endpoint, true);
      }

      console.error(`[SkinChef] Error:`, error.message);
      throw new SkinchefError(`Error de conexión: ${error.message}`, 500, endpoint, false);
    }
  }

  async generateMenu(
    userId: number,
    profile: UserProfile,
    days: number = 7
  ): Promise<GeneratedMenu> {
    return this.fetchWithRetry<GeneratedMenu>('/api/menu/generate', {
      method: 'POST',
      body: JSON.stringify({
        user_id: String(userId),
        profile: {
          budget_eur_week: profile.budget,
          diners: profile.diners,
          meals_per_day: profile.mealsPerDay,
          diet: profile.dietType,
          allergies: profile.allergies,
          dislikes: profile.dislikes,
          pantry_text: profile.pantryItems.join(', '),
          preference_vector: profile.preferenceVector || {}, // AI personalization
        },
        days,
      }),
    });
  }

  async swapMeal(
    userId: number,
    profile: UserProfile,
    menu: any,
    dayIndex: number,
    mealKey: string,
    constraints?: string
  ): Promise<{ menu: any; shoppingList: ShoppingItem[] }> {
    return this.fetchWithRetry('/api/menu/swap', {
      method: 'POST',
      body: JSON.stringify({
        user_id: String(userId),
        profile: {
          budget_eur_week: profile.budget,
          diners: profile.diners,
          meals_per_day: profile.mealsPerDay,
          diet: profile.dietType,
          allergies: profile.allergies,
          dislikes: profile.dislikes,
          preference_vector: profile.preferenceVector || {}, // AI personalization
        },
        menu,
        day_index: dayIndex,
        meal_key: mealKey,
        constraints,
      }),
    });
  }

  async getSubstitutions(
    userId: number,
    profile: UserProfile,
    ingredient: string,
    reason?: string
  ): Promise<Substitution[]> {
    return this.fetchWithRetry<Substitution[]>('/api/substitutions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: String(userId),
        profile: {
          diet: profile.dietType,
          allergies: profile.allergies,
          dislikes: profile.dislikes,
        },
        ingredient,
        reason,
      }),
    });
  }

  async chatWithChef(
    userId: number,
    message: string,
    context?: { menuId?: number; mealName?: string }
  ): Promise<ChatResponse> {
    return this.fetchWithRetry<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        user_id: String(userId),
        message,
        context,
      }),
    });
  }

  async getDailyTip(): Promise<DailyTip> {
    return this.fetchWithRetry<DailyTip>('/api/tips/daily', {
      method: 'GET',
    });
  }

  async estimateNutrition(
    mealName: string,
    ingredients: string[]
  ): Promise<NutritionEstimate> {
    return this.fetchWithRetry<NutritionEstimate>('/api/nutrition/estimate', {
      method: 'POST',
      body: JSON.stringify({
        meal_name: mealName,
        ingredients,
      }),
    });
  }

  async getRecipe(mealName: string): Promise<{
    name: string;
    ingredients: Array<{ name: string; quantity: string }>;
    steps: string[];
    time_min: number;
  }> {
    return this.fetchWithRetry('/api/recipe', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const skinChefService = new SkinChefService();
export default skinChefService;
