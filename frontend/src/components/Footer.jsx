import React from "react";
import { Instagram, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 bg-cocoa text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="font-serif text-2xl font-semibold">Kani's Whisk & Bakes</div>
          <p className="mt-3 text-cream/70 text-sm leading-relaxed">
            Small-batch brownies, cakes and cookies baked in Chennai. Bake. Love. Repeat.
          </p>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-peach">Shop</div>
          <ul className="mt-4 space-y-2 text-cream/80 text-sm">
            <li>Brownies</li>
            <li>Cakes</li>
            <li>Cookies</li>
            <li>Cupcakes</li>
            <li>Eggless</li>
          </ul>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-peach">Reach us</div>
          <ul className="mt-4 space-y-3 text-cream/80 text-sm">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Chennai, TN</li>
            <li className="flex items-center gap-2"><Instagram className="w-4 h-4" /> @kanis.bakes</li>
          </ul>
        </div>
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-peach">Delivery</div>
          <p className="mt-4 text-cream/80 text-sm leading-relaxed">
            Chennai only • Flat ₹50 delivery • Same-day for orders before 3 PM.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 text-xs text-cream/50 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Kani's Whisk & Bakes</span>
          <span>Baked with love in Chennai.</span>
        </div>
      </div>
    </footer>
  );
}
