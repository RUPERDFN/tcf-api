import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password mínimo 8 caracteres')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  budget_eur_week: z.number().min(30).max(500),
  diners: z.number().int().min(1).max(20),
  meals_per_day: z.number().int().min(1).max(3),
  days: z.number().int().refine(v => [3, 5, 7].includes(v), 'Días debe ser 3, 5 o 7'),
  diet_type: z.string().min(1),
  allergies: z.array(z.string()),
  favorite_foods: z.array(z.string()).min(3, 'Mínimo 3 alimentos favoritos'),
  disliked_foods: z.array(z.string()).optional(),
  pantry_items: z.string().optional()
});

export const menuSchema = z.object({
  days: z.number().int().min(3).max(7),
  menu_json: z.any(),
  total_cost_eur: z.number().optional()
});

export const shoppingListSchema = z.object({
  menu_id: z.string().uuid().optional(),
  list_json: z.any(),
  total_items: z.number().int().min(0).optional(),
  estimated_cost_eur: z.number().min(0).optional()
});

export const eventSchema = z.object({
  event_name: z.string().min(1, 'event_name es requerido'),
  event_data: z.any().optional(),
  session_id: z.string().optional()
});
