import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);
const STORAGE_KEY = "kwb_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.product_id === product.id ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: qty,
        },
      ];
    });
    toast.success("Added to cart", { description: product.name });
  }, []);

  const updateQty = useCallback((productId, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.product_id !== productId)
        : prev.map((p) => (p.product_id === productId ? { ...p, quantity: qty } : p))
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((p) => p.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((n, it) => n + it.quantity, 0);
    const subtotal = items.reduce((n, it) => n + it.price * it.quantity, 0);
    return { items, count, subtotal, addItem, updateQty, removeItem, clear, open, setOpen };
  }, [items, addItem, updateQty, removeItem, clear, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
