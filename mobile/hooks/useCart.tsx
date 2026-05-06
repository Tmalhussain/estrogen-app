import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Product } from '@/data/products';

type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  delivery: number;
  vat: number;
  total: number;
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const FREE_DELIVERY_THRESHOLD = 100;
const DELIVERY_FEE = 15;
const VAT_RATE = 0.15;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const delivery = items.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const vat = Math.round((subtotal + delivery) * VAT_RATE);
    const total = subtotal + delivery + vat;
    const count = items.reduce((s, i) => s + i.quantity, 0);

    return {
      items,
      count,
      subtotal,
      delivery,
      vat,
      total,
      add: (product, qty = 1) =>
        setItems((current) => {
          const idx = current.findIndex((i) => i.product.id === product.id);
          if (idx === -1) return [...current, { product, quantity: qty }];
          const next = [...current];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        }),
      remove: (productId) =>
        setItems((current) => current.filter((i) => i.product.id !== productId)),
      setQuantity: (productId, qty) =>
        setItems((current) =>
          qty <= 0
            ? current.filter((i) => i.product.id !== productId)
            : current.map((i) =>
                i.product.id === productId ? { ...i, quantity: qty } : i
              )
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
