import { z } from "zod";
import { create } from "zustand";

// --- Types ---
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export const MenuSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  items: z.array(z.string()),
  status: z.enum(["planned", "shopped", "cooked"]),
});

export const ShoppingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  checked: z.boolean(),
  category: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Menu = z.infer<typeof MenuSchema>;
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

// --- Mock Store ---
interface MockStore {
  user: User | null;
  token: string | null;
  menus: Menu[];
  shoppingList: ShoppingItem[];
  
  // Auth
  login: (email: string) => Promise<void>;
  register: (email: string) => Promise<void>;
  logout: () => void;
  
  // Menus
  addMenu: (menu: Omit<Menu, "id">) => Promise<void>;
  getMenus: () => Promise<Menu[]>;
  
  // Shopping
  addItem: (item: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
}

export const useStore = create<MockStore>((set, get) => ({
  user: null,
  token: null,
  menus: [
    { id: "1", title: "Weekend Dinner", date: "2024-03-15", items: ["Roast Chicken", "Potatoes", "Salad"], status: "planned" },
    { id: "2", title: "Taco Tuesday", date: "2024-03-12", items: ["Tacos", "Guacamole", "Salsa"], status: "cooked" },
  ],
  shoppingList: [
    { id: "1", name: "Chicken", checked: false, category: "Meat" },
    { id: "2", name: "Avocados", checked: true, category: "Produce" },
    { id: "3", name: "Tortillas", checked: true, category: "Pantry" },
  ],

  login: async (email) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    set({ 
      user: { id: "1", email, name: email.split("@")[0] },
      token: "mock-jwt-token" 
    });
  },

  register: async (email) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    set({ 
      user: { id: "1", email, name: email.split("@")[0] },
      token: "mock-jwt-token" 
    });
  },

  logout: () => set({ user: null, token: null }),

  addMenu: async (menu) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    set((state) => ({
      menus: [{ ...menu, id: Math.random().toString() }, ...state.menus]
    }));
  },

  getMenus: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return get().menus;
  },

  addItem: async (name) => {
    set((state) => ({
      shoppingList: [...state.shoppingList, { 
        id: Math.random().toString(), 
        name, 
        checked: false, 
        category: "Uncategorized" 
      }]
    }));
  },

  toggleItem: async (id) => {
    set((state) => ({
      shoppingList: state.shoppingList.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    }));
  }
}));
