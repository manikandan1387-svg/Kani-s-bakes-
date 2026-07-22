import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/api/client";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { id: "all", label: "All" },
  { id: "brownies", label: "Brownies" },
  { id: "cakes", label: "Cakes" },
  { id: "cookies", label: "Cookies" },
  { id: "cupcakes", label: "Cupcakes" },
  { id: "eggless", label: "Eggless" },
];

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const active = params.get("category") || "all";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products").then((r) => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (active === "all") return products;
    if (active === "eggless") return products.filter((p) => p.is_eggless);
    return products.filter((p) => p.category === active);
  }, [products, active]);

  const setActive = (id) => {
    if (id === "all") setParams({});
    else setParams({ category: id });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-14 animate-fade-up">
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">The menu</div>
        <h1 className="font-serif text-4xl md:text-6xl font-semibold text-cocoa mt-3">Pick your poison. Chocolate, mostly.</h1>
        <p className="mt-4 text-cocoa/70">Hand-baked in Chennai. Filter by category or hunt for eggless bakes only.</p>
      </div>

      <div className="mt-8 -mx-4 px-4 overflow-x-auto kwb-scrollbar">
        <div className="flex gap-2 min-w-max pb-2">
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                data-testid={`filter-${t.id}`}
                onClick={() => setActive(t.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-cocoa text-cream"
                    : "bg-white text-cocoa border border-cocoa/10 hover:border-cocoa/30"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="kwb-card overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))
          : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="font-serif text-2xl text-cocoa">Nothing here yet</div>
                <p className="text-cocoa/60 mt-2">Try a different category.</p>
              </div>
            ) : (
              filtered.map((p) => <ProductCard key={p.id} product={p} />)
            )}
      </div>
    </div>
  );
}
