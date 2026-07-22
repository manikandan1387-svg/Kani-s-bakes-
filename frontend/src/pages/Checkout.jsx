import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShoppingBag } from "lucide-react";
import api, { formatApiError } from "@/api/client";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const UPI_ID = "kanibakes@upi";
const PAYEE = "Kanis Whisk and Bakes";

export default function Checkout() {
  const nav = useNavigate();
  const { items, subtotal, clear, count } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    notes: "",
    utr: "",
  });
  const [paid, setPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  const total = subtotal + 50;
  const upiUri = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE,
      am: total.toFixed(2),
      cu: "INR",
      tn: "Kanis Bakes order",
    });
    return `upi://pay?${params.toString()}`;
  }, [total]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValid = () => {
    if (!form.name.trim()) return "Name is required";
    if (!/^\d{10}$/.test(form.phone)) return "Enter a 10-digit phone number";
    if (form.address.trim().length < 5) return "Delivery address is too short";
    if (!/^[A-Za-z0-9]{6,32}$/.test(form.utr.trim())) return "Enter your 12-digit UPI transaction reference (UTR)";
    if (!paid) return "Please confirm you've completed the UPI payment";
    return null;
  };

  const submit = async () => {
    const err = isValid();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim() || null,
        address: form.address.trim(),
        notes: form.notes.trim(),
        items: items.map((i) => ({
          product_id: i.product_id, name: i.name, price: i.price, quantity: i.quantity, image_url: i.image_url,
        })),
        payment_confirmed: paid,
        upi_reference: form.utr.trim().toUpperCase(),
      });
      clear();
      toast.success("Order placed!", { description: `Order ID: ${data.order_code}` });
      nav(`/track?code=${data.order_code}`);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (count === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-white border border-cocoa/10 flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-cocoa/40" />
        </div>
        <h1 className="font-serif text-3xl mt-6 text-cocoa">Your basket is empty</h1>
        <p className="mt-2 text-cocoa/60">Add a brownie or two before checking out.</p>
        <Button data-testid="empty-shop-btn" className="mt-6 rounded-full bg-cocoa text-cream hover:bg-cocoa-700" onClick={() => nav("/menu")}>Browse the menu</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 md:py-14 grid md:grid-cols-[1.15fr_1fr] gap-8 animate-fade-up">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Checkout</div>
        <h1 className="font-serif text-3xl md:text-5xl font-semibold text-cocoa mt-3">Almost in the oven.</h1>
        <p className="mt-2 text-cocoa/60">Fill in delivery details and complete UPI payment.</p>

        <div className="kwb-card p-6 mt-8 space-y-4">
          <h2 className="font-serif text-xl text-cocoa">Your details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" data-testid="checkout-name" value={form.name} onChange={setField("name")} placeholder="Kani K." className="mt-1.5 bg-white" />
            </div>
            <div>
              <Label htmlFor="phone">Phone (10 digits)</Label>
              <Input id="phone" data-testid="checkout-phone" inputMode="numeric" maxLength={10} value={form.phone} onChange={setField("phone")} placeholder="98765XXXXX" className="mt-1.5 bg-white" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" data-testid="checkout-email" type="email" value={form.email} onChange={setField("email")} placeholder="you@email.com" className="mt-1.5 bg-white" />
          </div>
          <div>
            <Label htmlFor="address">Delivery address (Chennai only)</Label>
            <Textarea id="address" data-testid="checkout-address" value={form.address} onChange={setField("address")} rows={3} placeholder="Flat, street, area, pincode" className="mt-1.5 bg-white" />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" data-testid="checkout-notes" value={form.notes} onChange={setField("notes")} rows={2} placeholder="Anything Kani should know?" className="mt-1.5 bg-white" />
          </div>
        </div>

        <div className="kwb-card p-6 mt-6">
          <h2 className="font-serif text-xl text-cocoa">Pay via UPI</h2>
          <p className="text-sm text-cocoa/60 mt-1">Scan this QR with any UPI app and complete the payment.</p>
          <div className="mt-4 flex flex-col md:flex-row gap-6 items-start">
            <div className="p-4 bg-white rounded-2xl border border-cocoa/10 self-start">
              <QRCodeSVG value={upiUri} size={180} bgColor="#ffffff" fgColor="#3B2416" level="M" data-testid="upi-qr" />
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div><span className="text-cocoa/60">UPI ID:</span> <span className="font-mono text-cocoa font-semibold">{UPI_ID}</span></div>
              <div><span className="text-cocoa/60">Payee:</span> <span className="text-cocoa">{PAYEE}</span></div>
              <div><span className="text-cocoa/60">Amount:</span> <span className="font-semibold text-cocoa">₹{total}</span></div>
              <label className="flex items-start gap-3 mt-4 cursor-pointer">
                <Checkbox checked={paid} onCheckedChange={(v) => setPaid(!!v)} data-testid="payment-done-checkbox" />
                <span className="text-cocoa">I've completed the UPI payment</span>
              </label>

              <div className="mt-4">
                <Label htmlFor="utr">UPI transaction reference (UTR)</Label>
                <Input
                  id="utr"
                  data-testid="checkout-utr"
                  value={form.utr}
                  onChange={(e) => setForm((f) => ({ ...f, utr: e.target.value.toUpperCase() }))}
                  placeholder="e.g. 402512345678"
                  maxLength={32}
                  className="mt-1.5 bg-white font-mono tracking-wider"
                />
                <p className="text-xs text-cocoa/50 mt-1">
                  Find this in your UPI app under the transaction — usually a 12-digit reference. Kani verifies this before starting your bake.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-cocoa/50 mt-3">
                <ShieldCheck className="w-3.5 h-3.5" /> We verify UPI payments manually before dispatch.
              </div>
            </div>
          </div>
        </div>

        <Button
          data-testid="place-order-btn"
          disabled={submitting}
          onClick={submit}
          className="mt-6 w-full h-14 rounded-full bg-cocoa text-cream hover:bg-cocoa-700 text-base font-semibold"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Place order · ₹${total}`}
        </Button>
      </div>

      {/* Order summary */}
      <aside className="md:sticky md:top-24 h-fit">
        <div className="kwb-card p-6">
          <h2 className="font-serif text-xl text-cocoa">Order summary</h2>
          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto kwb-scrollbar">
            {items.map((it) => (
              <div key={it.product_id} className="flex gap-3">
                <img src={it.image_url} alt={it.name} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cocoa truncate">{it.name}</div>
                  <div className="text-xs text-cocoa/60">Qty {it.quantity} × ₹{it.price}</div>
                </div>
                <div className="text-sm font-semibold text-cocoa">₹{it.price * it.quantity}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-cocoa/10 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-cocoa/70"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between text-cocoa/70"><span>Delivery</span><span>₹50</span></div>
            <div className="flex justify-between font-serif text-xl text-cocoa font-semibold pt-2 border-t border-cocoa/10"><span>Total</span><span data-testid="summary-total">₹{total}</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
