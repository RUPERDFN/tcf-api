import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface MenuData {
  days: Array<{
    date: string;
    meals: {
      breakfast?: MealItem;
      lunch?: MealItem;
      dinner?: MealItem;
    };
  }>;
}

export interface MealItem {
  name: string;
  ingredients: string[];
  instructions?: string;
  prepTime?: number;
  calories?: number;
}

export interface ShoppingListItem {
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

export interface GamificationStats {
  points: number;
  level: number;
  streak: number;
  longestStreak: number;
  badges: string[];
}
