import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X, RefreshCw, ShieldCheck, ShieldAlert, Copy } from "lucide-react";
import api, { formatApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
  { key: "verified", label: "Verified" },
  { key: "all", label: "All" },
];

export default function PaymentsManager({ onChanged }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null); // order being rejected
  const [note, setNote] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/orders").then((r) => setOrders(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => (o.payment_status || "verified") === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c = { pending: 0, rejected: 0, verified: 0 };
    orders.forEach((o) => { c[o.payment_status || "verified"] = (c[o.payment_status || "verified"] || 0) + 1; });
    return c;
  }, [orders]);

  const setStatus = async (order, payment_status, payment_note = "") => {
    try {
      await api.patch(`/orders/${order.id}/payment`, { payment_status, payment_note });
      toast.success(`Payment ${payment_status} · ${order.order_code}`);
      load();
      onChanged && onChanged();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed");
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    await setStatus(rejecting, "rejected", note.trim());
    setRejecting(null);
    setNote("");
  };

  const copyUtr = (utr) => {
    if (!utr) return;
    navigator.clipboard?.writeText(utr);
    toast.success("UTR copied");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n = f.key === "all" ? orders.length : counts[f.key] || 0;
            return (
              <button
                key={f.key}
                data-testid={`pay-filter-${f.key}`}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active ? "bg-cocoa text-cream" : "bg-white text-cocoa border border-cocoa/10 hover:border-cocoa/30"
                }`}
              >
                {f.label} <span className={`ml-1 ${active ? "text-cream/70" : "text-cocoa/40"}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <button data-testid="pay-refresh-btn" onClick={load} className="inline-flex items-center gap-2 text-sm text-cocoa/70 hover:text-cocoa">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? <div className="text-cocoa/60">Loading…</div> : filtered.length === 0 ? (
        <div className="kwb-card p-10 text-center">
          <ShieldCheck className="w-8 h-8 mx-auto text-cocoa/40" />
          <div className="font-serif text-xl text-cocoa mt-3">No orders here</div>
          <p className="text-cocoa/60 text-sm mt-1">
            {filter === "pending" ? "You're all caught up on payment verification." :
             filter === "rejected" ? "No rejected payments." : "Nothing to show."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const pay = o.payment_status || "verified";
            const style = pay === "verified" ? "bg-green-100 text-green-900" : pay === "rejected" ? "bg-destructive/10 text-destructive" : "bg-gold/20 text-cocoa";
            return (
              <div key={o.id} data-testid={`pay-card-${o.order_code}`} className="kwb-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-serif text-lg font-semibold text-cocoa">{o.order_code}</div>
                    <div className="text-xs text-cocoa/60">{o.customer_name} · {o.customer_phone}</div>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${style}`}>{pay}</span>
                </div>

                <div className="rounded-xl bg-cream-200 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-cocoa/50">UPI reference</div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="font-mono text-cocoa font-semibold tracking-wider truncate" data-testid={`pay-utr-${o.order_code}`}>
                      {o.upi_reference || <span className="italic text-cocoa/40">Not provided</span>}
                    </div>
                    {o.upi_reference && (
                      <button aria-label="Copy UTR" onClick={() => copyUtr(o.upi_reference)} className="text-cocoa/50 hover:text-cocoa">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm text-cocoa/70">
                  <div><span className="text-cocoa/50">Amount:</span> <span className="font-semibold text-cocoa">₹{o.total}</span></div>
                  <div className="text-xs text-cocoa/50 mt-1">Placed {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                  {o.payment_note && <div className="text-xs text-destructive mt-2">Note: {o.payment_note}</div>}
                </div>

                <div className="mt-auto pt-2 flex gap-2">
                  {pay !== "verified" ? (
                    <Button
                      data-testid={`pay-verify-${o.order_code}`}
                      onClick={() => setStatus(o, "verified")}
                      className="flex-1 rounded-full bg-cocoa text-cream hover:bg-cocoa-700"
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Verify
                    </Button>
                  ) : (
                    <Button
                      data-testid={`pay-unverify-${o.order_code}`}
                      variant="outline"
                      onClick={() => setStatus(o, "pending")}
                      className="flex-1 rounded-full border-cocoa/20 text-cocoa"
                    >
                      Undo verify
                    </Button>
                  )}
                  {pay !== "rejected" && (
                    <Button
                      data-testid={`pay-reject-${o.order_code}`}
                      variant="outline"
                      onClick={() => { setRejecting(o); setNote(o.payment_note || ""); }}
                      className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4 mr-1.5" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(v) => { if (!v) setRejecting(null); }}>
        <DialogContent className="bg-cream border-cocoa/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-cocoa flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" /> Reject payment
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-cocoa/70">
            Rejecting {rejecting?.order_code} — the customer will get a WhatsApp with your note asking for a fresh UTR.
          </div>
          <div>
            <Label htmlFor="reject-note">Note to customer (optional)</Label>
            <Textarea id="reject-note" data-testid="reject-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1.5 bg-white" placeholder="e.g. UTR not found in our UPI statement. Please share the correct reference." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejecting(null); setNote(""); }} className="rounded-full">Cancel</Button>
            <Button data-testid="reject-confirm-btn" onClick={submitReject} className="rounded-full bg-destructive text-white hover:bg-destructive/90">Reject payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
