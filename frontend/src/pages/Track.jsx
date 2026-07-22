import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle2, Clock, ChefHat, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STEPS = [
  { key: "new", label: "Order received", icon: Clock },
  { key: "baking", label: "Baking", icon: ChefHat },
  { key: "packed", label: "Packed", icon: Package },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function Track() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = async (c) => {
    if (!c) return;
    setLoading(true); setError("");
    try {
      const { data } = await api.get(`/orders/track/${c}`);
      setOrder(data);
    } catch (e) {
      setOrder(null);
      setError(formatApiError(e.response?.data?.detail) || "Order not found");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (params.get("code")) fetchOrder(params.get("code"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Enter your order ID");
    setParams({ code: code.trim().toUpperCase() });
    fetchOrder(code.trim().toUpperCase());
  };

  const currentIndex = order ? Math.max(0, STEPS.findIndex((s) => s.key === order.status)) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-14 animate-fade-up">
      <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Track order</div>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold text-cocoa mt-3">Where's my brownie?</h1>
      <p className="mt-2 text-cocoa/60">Enter your order ID (starts with <span className="font-mono">KWB-</span>).</p>

      <form onSubmit={submit} className="mt-6 kwb-card p-4 flex gap-2">
        <Input
          data-testid="track-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="KWB-XXXXX"
          className="bg-white uppercase"
        />
        <Button type="submit" data-testid="track-search-btn" className="rounded-full bg-cocoa text-cream hover:bg-cocoa-700 px-6">
          <Search className="w-4 h-4 mr-2" /> Track
        </Button>
      </form>

      {loading && <div className="mt-6 text-cocoa/60">Looking that up…</div>}

      {error && !loading && <div className="mt-6 kwb-card p-6 text-cocoa/70">{error}</div>}

      {order && (
        <div className="mt-8 kwb-card p-6 md:p-8 animate-fade-up" data-testid="track-order-card">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-cocoa/50">Order</div>
              <div className="font-serif text-2xl text-cocoa font-semibold">{order.order_code}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-cocoa/50">Total</div>
              <div className="font-serif text-2xl text-cocoa font-semibold">₹{order.total}</div>
            </div>
          </div>

          {/* Payment status pill */}
          {order.payment_status && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                order.payment_status === "verified" ? "bg-green-100 text-green-900" :
                order.payment_status === "rejected" ? "bg-destructive/10 text-destructive" :
                "bg-cream-200 text-cocoa"
              }`}>
                {order.payment_status === "verified" ? "Payment verified" :
                 order.payment_status === "rejected" ? "Payment rejected" : "Payment pending verification"}
              </span>
              {order.upi_reference && (
                <span className="text-xs text-cocoa/50 font-mono">UTR: {order.upi_reference}</span>
              )}
              {order.payment_status === "rejected" && order.payment_note && (
                <div className="w-full text-sm text-destructive mt-1">{order.payment_note}</div>
              )}
            </div>
          )}

          {order.status === "cancelled" ? (
            <div className="mt-6 p-4 rounded-2xl bg-destructive/10 text-destructive font-medium">
              This order was cancelled.
            </div>
          ) : (
            <ol className="mt-8 relative">
              <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-cocoa/10" />
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i <= currentIndex;
                return (
                  <li key={s.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      done ? "bg-cocoa text-cream" : "bg-cream border border-cocoa/15 text-cocoa/40"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="pt-1.5">
                      <div className={`font-semibold ${done ? "text-cocoa" : "text-cocoa/50"}`}>{s.label}</div>
                      {i === currentIndex && <div className="text-xs text-peach-700 mt-0.5">Current stage</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 border-t border-cocoa/10 pt-4 grid gap-2 text-sm text-cocoa/70">
            <div><span className="text-cocoa/50">Name:</span> {order.customer_name}</div>
            <div><span className="text-cocoa/50">Phone:</span> {order.customer_phone}</div>
            <div><span className="text-cocoa/50">Address:</span> {order.address}</div>
            <div className="mt-2">
              <span className="text-cocoa/50">Items:</span>
              <ul className="mt-1 space-y-1">
                {order.items.map((it, idx) => (
                  <li key={idx} className="text-cocoa">• {it.quantity} × {it.name} <span className="text-cocoa/50">(₹{it.price * it.quantity})</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
