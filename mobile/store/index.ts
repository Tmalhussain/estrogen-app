import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../i18n/strings';

// ── Cart Store (persisted locally — no need for Firestore) ───

export interface CartItem {
  productId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  requiresPrescription: boolean;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  promoCode: string | null;
  discount: number;
  addItem: (item: CartItem, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  applyPromo: (code: string, subtotal: number) => boolean;
  clearPromo: () => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discount: 0,
      addItem: (item, qty) => {
        const amount = qty ?? 1;
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: i.quantity + amount } : i
            ),
          }));
        } else {
          set((state) => ({ items: [...state.items, { ...item, quantity: amount }] }));
        }
        // Trigger toast notification
        const totalItems = get().items.reduce((sum, i) => sum + i.quantity, 0);
        useCartToastStore.getState().show(item.nameAr, item.nameEn, item.image ?? '', totalItems);
      },
      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.productId !== productId);
        const promo = get().promoCode;
        if (newItems.length === 0) {
          set({ items: [], promoCode: null, discount: 0 });
        } else {
          const newSubtotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
          const newDiscount = promo === 'ESTROGEN10' ? newSubtotal * 0.1 : promo === 'WELCOME' ? 20 : 0;
          set({ items: newItems, discount: promo ? newDiscount : 0 });
        }
      },
      updateQty: (productId, qty) => {
        const newItems = qty <= 0
          ? get().items.filter((i) => i.productId !== productId)
          : get().items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i);
        const promo = get().promoCode;
        if (newItems.length === 0) {
          set({ items: [], promoCode: null, discount: 0 });
        } else {
          const newSubtotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
          const newDiscount = promo === 'ESTROGEN10' ? newSubtotal * 0.1 : promo === 'WELCOME' ? 20 : 0;
          set({ items: newItems, discount: promo ? newDiscount : 0 });
        }
      },
      applyPromo: (code, subtotal) => {
        const upper = code.toUpperCase();
        if (upper === 'ESTROGEN10') {
          set({ promoCode: upper, discount: subtotal * 0.1 });
          return true;
        } else if (upper === 'WELCOME') {
          set({ promoCode: upper, discount: 20 });
          return true;
        }
        return false;
      },
      clearPromo: () => set({ promoCode: null, discount: 0 }),
      clearCart: () => set({ items: [], promoCode: null, discount: 0 }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Cart Toast Store (NOT persisted — transient UI state) ─────

interface CartToastStore {
  visible: boolean;
  productNameAr: string;
  productNameEn: string;
  productImage: string;
  cartItemCount: number;
  show: (nameAr: string, nameEn: string, image: string, cartCount: number) => void;
  dismiss: () => void;
}

export const useCartToastStore = create<CartToastStore>()((set) => ({
  visible: false,
  productNameAr: '',
  productNameEn: '',
  productImage: '',
  cartItemCount: 0,
  show: (nameAr, nameEn, image, cartCount) => set({
    visible: true,
    productNameAr: nameAr,
    productNameEn: nameEn,
    productImage: image,
    cartItemCount: cartCount,
  }),
  dismiss: () => set({ visible: false }),
}));

// ── Auth Store (persisted — syncs with Firebase Auth) ─────────
//
// This store handles LOCAL preferences (language, welcome screen).
// The actual auth state is managed by Firebase Auth via useAuth hook.
// The login/logout methods here are called by the useAuth hook
// to keep the store in sync with Firebase state.

interface AuthUser {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  nationalId?: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoggedIn: boolean;
  language: Language;
  hasSeenWelcome: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setHasSeenWelcome: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      language: 'ar',
      hasSeenWelcome: false,
      login: (user) => set({ user, isLoggedIn: true, hasSeenWelcome: true }),
      logout: () => set({ user: null, isLoggedIn: false, hasSeenWelcome: false }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () =>
        set({ language: get().language === 'ar' ? 'en' : 'ar' }),
      setHasSeenWelcome: () => set({ hasSeenWelcome: true }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Medical Profile Store (persisted locally + synced to Firestore) ──
//
// Local persistence for offline access. The useAuth hook syncs this
// data to/from the Firestore users/{uid} document.

interface MedicalProfile {
  pregnancyStatus: 'not_pregnant' | 'pregnant' | 'breastfeeding' | 'planning';
  bloodType: string | null;
  allergies: string[];
  conditions: string[];
}

interface ProfileStore {
  medical: MedicalProfile;
  setMedical: (data: Partial<MedicalProfile>) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      medical: {
        pregnancyStatus: 'not_pregnant',
        bloodType: null,
        allergies: [],
        conditions: [],
      },
      setMedical: (data) =>
        set((state) => ({
          medical: { ...state.medical, ...data },
        })),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
