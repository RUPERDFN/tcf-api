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

export const passwordSchema = z.string().min(8, 'Password mínimo 8 caracteres');

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string().min(8, 'Password mínimo 8 caracteres')
});

const validAllergies = ['gluten', 'lactosa', 'frutos_secos', 'mariscos', 'huevo', 'soja', 'pescado'] as const;
const validDiets = ['omnivora', 'vegetariana', 'vegana', 'pescetariana', 'flexitariana'] as const;

export const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  budgetWeekly: z.number().min(20).max(500).optional(),
  diners: z.number().int().min(1).max(12).optional(),
  mealsPerDay: z.number().int().min(1).max(4).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  dietType: z.enum(validDiets).optional(),
  allergies: z.array(z.enum(validAllergies)).optional(),
  dislikes: z.array(z.string().max(50)).max(50).optional(),
  pantryItems: z.array(z.string()).optional(),
  pantryText: z.string().max(1000).optional()
});

export const deleteAccountSchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: 'Debes confirmar la eliminación con confirm: true' }) })
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
