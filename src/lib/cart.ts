"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  price: number;
  image: string | null;
  quantity: number;
  maxStock: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              isOpen: true,
              lines: state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, ...line, quantity: Math.min(l.quantity + quantity, line.maxStock) }
                  : l,
              ),
            };
          }
          return { isOpen: true, lines: [...state.lines, { ...line, quantity: Math.min(quantity, line.maxStock) }] };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(Math.max(quantity, 0), l.maxStock) } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (variantId) => set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "devon-bag", partialize: (s) => ({ lines: s.lines }) },
  ),
);

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
