import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../i18n/translations';

export interface Category {
  id: string;
  name: { en: string; ar: string; ku: string };
  image: string;
  order: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: { en: string; ar: string; ku: string };
  description: { en: string; ar: string; ku: string };
  price: number;
  image: string;
  order: number;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
}

export interface Banner {
  id: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
}

export interface CafeSettings {
  name: { en: string; ar: string; ku: string };
  logo: string;
  themeColor: string;
  baseUrl?: string;
  tableCount?: number;
}

interface AppState {
  lang: Language;
  setLang: (lang: Language) => void;
  tableNum: string | null;
  setTableNum: (num: string | null) => void;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  banners: Banner[];
  setBanners: (banners: Banner[]) => void;
  settings: CafeSettings;
  setSettings: (settings: CafeSettings) => void;
  lastFetch: number;
  setLastFetch: (time: number) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lang: 'ku',
      setLang: (lang) => set({ lang }),
      tableNum: null,
      setTableNum: (tableNum) => set({ tableNum }),
      categories: [],
      setCategories: (categories) => set({ categories }),
      menuItems: [],
      setMenuItems: (menuItems) => set({ menuItems }),
      banners: [],
      setBanners: (banners) => set({ banners }),
      settings: {
        name: { en: 'MasCafe', ar: 'ماس كافيه', ku: 'ماس کافێ' },
        logo: '',
        themeColor: '#f59e0b', // amber-500
        baseUrl: 'https://melt.masmenu.workers.dev/',
        tableCount: 15,
      },
      setSettings: (settings) => set({ settings }),
      lastFetch: 0,
      setLastFetch: (lastFetch) => set({ lastFetch }),
      cart: [],
      addToCart: (item) => set((state) => {
        const existing = state.cart.find(c => c.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
          };
        }
        return { cart: [...state.cart, { ...item, cartItemId: Math.random().toString(36).substr(2, 9), quantity: 1 }] };
      }),
      removeFromCart: (cartItemId) => set((state) => ({
        cart: state.cart.filter(c => c.cartItemId !== cartItemId)
      })),
      updateQuantity: (cartItemId, delta) => set((state) => ({
        cart: state.cart.map(c => {
          if (c.cartItemId === cartItemId) {
            const newQ = Math.max(1, c.quantity + delta);
            return { ...c, quantity: newQ };
          }
          return c;
        })
      })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'mascafe-storage-v2',
    }
  )
);
