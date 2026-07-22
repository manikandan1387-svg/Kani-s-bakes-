import React, { useEffect, useState } from "react";
import { Check, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/api/client";

export default function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/reviews?all=true").then((r) => setReviews(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const approve = async (r, approved) => {
    try {
      await api.patch(`/reviews/${r.id}/approve?approved=${approved}`);
      toast.success(approved ? "Approved" : "Unapproved");
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Failed"); }
  };
  const del = async (r) => {
    if (!window.confirm("Delete this review?")) return;
    try { await api.delete(`/reviews/${r.id}`); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Failed"); }
  };

  if (loading) return <div className="text-cocoa/60">Loading…</div>;
  if (!reviews.length) return <div className="kwb-card p-8 text-center text-cocoa/60">No reviews yet.</div>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="kwb-card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex gap-1 mb-1">
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
              </div>
              <div className="font-semibold text-cocoa">{r.author_name}</div>
              <p className="text-sm text-cocoa/70 mt-1">"{r.text}"</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.approved ? "bg-green-100 text-green-900" : "bg-cream-200 text-cocoa"}`}>{r.approved ? "Approved" : "Pending"}</span>
              <button data-testid={`approve-${r.id}`} onClick={() => approve(r, !r.approved)} className="w-8 h-8 rounded-full hover:bg-cocoa/10 flex items-center justify-center text-cocoa"><Check className="w-4 h-4" /></button>
              <button data-testid={`del-review-${r.id}`} onClick={() => del(r)} className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
