import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import api from "@/api/client";

const STATUS_LABEL = {
  new: "Order received",
  baking: "Baking",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLE = {
  new: "bg-cream-200 text-cocoa",
  baking: "bg-peach text-cocoa",
  packed: "bg-gold text-cocoa",
  out_for_delivery: "bg-cocoa-100 text-cocoa",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine")
      .then((r) => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 md:py-14 animate-fade-up">
      <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">My orders</div>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-cocoa mt-3">Your order history</h1>

      {loading && <div className="mt-8 text-cocoa/60">Loading…</div>}

      {!loading && orders.length === 0 && (
        <div className="mt-10 kwb-card p-10 text-center">
          <Package className="w-10 h-10 mx-auto text-cocoa/30" />
          <div className="mt-4 font-serif text-2xl text-cocoa">No orders yet</div>
          <p className="text-cocoa/60 mt-1">Your future brownies are waiting.</p>
          <Link to="/menu" data-testid="orders-shop-link" className="inline-block mt-6 px-6 py-3 rounded-full bg-cocoa text-cream hover:bg-cocoa-700 transition-colors">Browse menu</Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {orders.map((o) => (
          <Link to={`/track?code=${o.order_code}`} data-testid={`order-row-${o.order_code}`} key={o.id} className="kwb-card p-5 flex flex-wrap items-center gap-4 hover:shadow-warm transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="font-serif text-lg font-semibold text-cocoa">{o.order_code}</div>
              <div className="text-sm text-cocoa/60 truncate">{o.items.length} item{o.items.length===1?"":"s"} • ₹{o.total}</div>
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ${STATUS_STYLE[o.status] || "bg-cream-200 text-cocoa"}`}>{STATUS_LABEL[o.status] || o.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
