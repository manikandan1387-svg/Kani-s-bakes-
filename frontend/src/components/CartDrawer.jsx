import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

export default function CartDrawer() {
  const { open, setOpen, items, updateQty, removeItem, subtotal, count } = useCart();
  const nav = useNavigate();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-cream border-l border-cocoa/10 flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-cocoa/10 text-left">
          <SheetTitle className="font-serif text-2xl text-cocoa">Your basket</SheetTitle>
          <p className="text-sm text-cocoa/60">{count} item{count === 1 ? "" : "s"} • Warm from Kani's kitchen</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto kwb-scrollbar px-6 py-4 space-y-4" data-testid="cart-items">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white border border-cocoa/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-cocoa/40" />
              </div>
              <p className="font-serif text-xl text-cocoa">Your basket is empty</p>
              <p className="text-sm text-cocoa/60 mt-1">Add a brownie or two — your future self will thank you.</p>
              <Button data-testid="cart-shop-btn" onClick={() => { setOpen(false); nav("/menu"); }} className="mt-6 rounded-full bg-cocoa text-cream hover:bg-cocoa-700">Browse the menu</Button>
            </div>
          ) : (
            items.map((it) => (
              <div key={it.product_id} data-testid={`cart-item-${it.product_id}`} className="flex gap-3 kwb-card p-3">
                <img src={it.image_url} alt={it.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-cocoa truncate">{it.name}</div>
                  <div className="text-sm text-cocoa/60 mt-0.5">₹{it.price} × {it.quantity}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center bg-cream rounded-full border border-cocoa/10">
                      <button aria-label="Decrease" data-testid={`cart-dec-${it.product_id}`} onClick={() => updateQty(it.product_id, it.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cocoa/10 text-cocoa">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-cocoa">{it.quantity}</span>
                      <button aria-label="Increase" data-testid={`cart-inc-${it.product_id}`} onClick={() => updateQty(it.product_id, it.quantity + 1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cocoa/10 text-cocoa">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button aria-label="Remove" data-testid={`cart-remove-${it.product_id}`} onClick={() => removeItem(it.product_id)} className="text-cocoa/60 hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="font-semibold text-cocoa">₹{it.price * it.quantity}</div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-cocoa/10 bg-white p-6 space-y-3">
            <div className="flex justify-between text-sm text-cocoa/70">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-cocoa/70">
              <span>Delivery (Chennai flat)</span>
              <span>₹50</span>
            </div>
            <div className="flex justify-between font-serif text-xl font-semibold text-cocoa pt-2 border-t border-cocoa/10">
              <span>Total</span>
              <span data-testid="cart-total">₹{subtotal + 50}</span>
            </div>
            <Button
              data-testid="checkout-btn"
              onClick={() => { setOpen(false); nav("/checkout"); }}
              className="w-full rounded-full bg-cocoa text-cream hover:bg-cocoa-700 h-12 text-base"
            >
              Proceed to checkout
            </Button>
            <Link to="/menu" onClick={() => setOpen(false)} className="block text-center text-sm text-cocoa/60 hover:text-cocoa">
              or add a little more
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
