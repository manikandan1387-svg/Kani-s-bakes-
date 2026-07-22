import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Truck, Cookie, Star } from "lucide-react";
import api from "@/api/client";
import ProductCard from "@/components/ProductCard";

const HERO_IMG = "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwY2FrZSUyMGFlc3RoZXRpY3xlbnwwfHx8fDE3ODQ3MjE5ODl8MA&ixlib=rb-4.1.0&q=85";

const CATEGORIES = [
  { id: "brownies", label: "Brownies", img: "https://images.pexels.com/photos/4597835/pexels-photo-4597835.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { id: "cakes", label: "Cakes", img: "https://images.unsplash.com/photo-1549572189-dddb1adf739b?auto=format&fit=crop&w=600&q=80" },
  { id: "cookies", label: "Cookies", img: "https://images.pexels.com/photos/36446733/pexels-photo-36446733.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
  { id: "cupcakes", label: "Cupcakes", img: "https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=600&q=80" },
  { id: "eggless", label: "Eggless", img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data.slice(0, 6))).catch(() => {});
    api.get("/reviews").then((r) => setReviews(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-up">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Bundt cake" className="w-full h-full object-cover" />
          <div className="absolute inset-0 kwb-hero-overlay" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 lg:py-36 min-h-[80vh] flex flex-col justify-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 kwb-glass rounded-full px-4 py-1.5 text-sm text-cocoa mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Small-batch • Chennai</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-black text-cream leading-[0.95]">
              Bake.<br />
              Love.<br />
              <span className="text-peach">Repeat.</span>
            </h1>
            <p className="mt-6 text-cream/90 text-base md:text-lg max-w-xl leading-relaxed">
              Fudgy brownies, buttery cookies and cinematic cakes — hand-baked by Kani in Chennai. Order today, delivered warm to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/menu"
                data-testid="hero-order-btn"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-cream text-cocoa font-semibold hover:bg-peach transition-colors duration-300"
              >
                Order now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/track"
                data-testid="hero-track-btn"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-transparent border border-cream/60 text-cream font-semibold hover:bg-cream/10 transition-colors duration-300"
              >
                Track order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* USP STRIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-10 relative z-10">
        <div className="kwb-card p-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: Cookie, title: "Small-batch, always fresh", body: "Baked to order — never sits on a shelf." },
            { icon: Truck, title: "Chennai delivery", body: "Same-day dispatch • flat ₹50 delivery." },
            { icon: Star, title: "4.9 star average", body: "From 400+ happy customers." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center text-cocoa flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-cocoa">{title}</div>
                <div className="text-sm text-cocoa/60">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Shop by mood</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-cocoa mt-2">Something for every craving</h2>
          </div>
          <Link to="/menu" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-cocoa hover:text-peach-700">View all <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/menu?category=${c.id}`}
              data-testid={`cat-${c.id}`}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-soft hover:shadow-warm transition-shadow duration-300"
            >
              <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa-800/85 via-cocoa-800/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="font-serif text-xl text-cream font-semibold">{c.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">This week's bakes</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-cocoa mt-2">Fresh out of the oven</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-28 grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-3xl overflow-hidden shadow-warm">
          <img src="https://images.unsplash.com/photo-1587248720327-8eb72564be1e?auto=format&fit=crop&w=1200&q=80" alt="Kani baking" className="w-full h-full object-cover aspect-[4/5]" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Meet Kani</div>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-cocoa mt-3 leading-tight">A tiny kitchen. A very big whisk.</h2>
          <p className="mt-5 text-cocoa/70 leading-relaxed">
            What started as a Sunday hobby turned into a warm little bakery in Chennai. Every brownie, cake and cookie is baked personally by Kani — same day, small batch, no shortcuts. Just butter, chocolate, and a lot of love.
          </p>
          <Link to="/menu" className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-cocoa text-cream hover:bg-cocoa-700 transition-colors">
            Start an order <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-28">
          <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Kind words</div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-cocoa mt-2 mb-10">What Chennai says</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="kwb-card p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
                </div>
                <p className="text-cocoa/80 leading-relaxed">"{r.text}"</p>
                <div className="mt-4 font-semibold text-cocoa">{r.author_name}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
