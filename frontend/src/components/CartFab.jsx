import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartFab() {
  const { count, setOpen } = useCart();
  if (count === 0) return null;
  return (
    <button
      data-testid="cart-fab"
      aria-label={`Open cart (${count} items)`}
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-30 kwb-glass shadow-warm rounded-full pl-5 pr-3 py-3 flex items-center gap-3 hover:shadow-2xl transition-shadow duration-300"
    >
      <ShoppingBag className="w-5 h-5 text-cocoa" />
      <span className="font-semibold text-cocoa">View basket</span>
      <span className="bg-cocoa text-cream text-xs font-semibold rounded-full w-7 h-7 flex items-center justify-center">{count}</span>
    </button>
  );
}
