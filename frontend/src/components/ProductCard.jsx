import React, { useState } from "react";
import { Plus, Minus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";

const badgeStyles = {
  Bestseller: "bg-gold text-cocoa",
  New: "bg-peach text-cocoa",
  Eggless: "bg-cocoa text-cream",
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group kwb-card overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-warm transition-transform duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {(product.badges || []).map((b) => (
            <span
              key={b}
              className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeStyles[b] || "bg-white text-cocoa"}`}
            >
              {b}
            </span>
          ))}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur">
          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
          <span className="text-xs font-semibold text-cocoa">{product.rating?.toFixed(1) ?? "4.7"}</span>
          <span className="text-[11px] text-cocoa/60">({product.rating_count || 0})</span>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-cocoa leading-tight">{product.name}</h3>
          <p className="mt-1 text-sm text-cocoa/65 line-clamp-2">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-cocoa/50">Starts at</div>
            <div className="font-serif text-2xl font-bold text-cocoa">₹{product.price}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-cream rounded-full border border-cocoa/10">
              <button
                data-testid={`qty-dec-${product.id}`}
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-cocoa hover:bg-cocoa/10 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span data-testid={`qty-val-${product.id}`} className="w-8 text-center font-semibold text-cocoa">{qty}</span>
              <button
                data-testid={`qty-inc-${product.id}`}
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-cocoa hover:bg-cocoa/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              data-testid={`add-cart-${product.id}`}
              onClick={() => addItem(product, qty)}
              className="px-4 py-2 rounded-full bg-cocoa text-cream text-sm font-semibold hover:bg-cocoa-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
