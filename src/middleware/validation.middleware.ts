import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password mínimo 8 caracteres'),
  name: z.string().min(2).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  budgetWeekly: z.number().min(10).max(1000).optional(),
  diners: z.number().int().min(1).max(20).optional(),
  mealsPerDay: z.number().int().min(1).max(3).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  dietType: z.string().min(1).optional(),
  allergies: z.array(z.string()).optional(),
  dislikes: z.array(z.string()).optional(),
  pantryItems: z.array(z.string()).optional()
});

export const menuGenerateSchema = z.object({
  weekStart: z.string().optional(),
  preferences: z.object({
    budget: z.number().optional(),
    diners: z.number().optional(),
    dietType: z.string().optional()
  }).optional()
});

export const completeMealSchema = z.object({
  menuId: z.number().int(),
  dayIndex: z.number().int().min(0).max(6),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional()
});

export const shoppingItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.string().optional(),
  category: z.string().optional()
});

export const togglePurchasedSchema = z.object({
  isPurchased: z.boolean()
});
