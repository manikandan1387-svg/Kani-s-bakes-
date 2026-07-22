import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const CATS = ["ingredients", "packaging", "delivery", "marketing", "other"];
const today = () => new Date().toISOString().slice(0, 10);

export default function ExpensesManager({ onChanged }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ date: today(), category: "ingredients", description: "", amount: 0 });

  const load = async () => {
    const [e, s] = await Promise.all([
      api.get("/expenses"),
      api.get("/admin/stats"),
    ]);
    setItems(e.data);
    setStats(s.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const totalByCat = useMemo(() => {
    const m = {};
    items.forEach((i) => { m[i.category] = (m[i.category] || 0) + i.amount; });
    return m;
  }, [items]);

  const add = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Enter a valid amount");
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      setForm({ date: today(), category: "ingredients", description: "", amount: 0 });
      toast.success("Expense added");
      load();
      onChanged && onChanged();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await api.delete(`/expenses/${id}`); load(); onChanged && onChanged(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail) || "Failed"); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <div className="kwb-card p-5 h-fit">
        <div className="font-serif text-xl text-cocoa">Quick P&amp;L</div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-cocoa/60">Revenue (delivered)</span><span className="font-semibold text-cocoa">₹{stats?.revenue_total || 0}</span></div>
          <div className="flex justify-between"><span className="text-cocoa/60">Expenses</span><span className="font-semibold text-cocoa">₹{stats?.expenses_total || 0}</span></div>
          <div className="flex justify-between border-t border-cocoa/10 pt-2"><span className="text-cocoa/60">Profit estimate</span><span className="font-serif text-lg text-cocoa font-bold">₹{stats?.profit_estimate || 0}</span></div>
        </div>
        <div className="border-t border-cocoa/10 mt-4 pt-4">
          <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-2">By category</div>
          {CATS.map((c) => (
            <div key={c} className="flex justify-between text-sm py-1">
              <span className="capitalize text-cocoa/70">{c}</span>
              <span className="text-cocoa">₹{totalByCat[c] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="kwb-card p-5">
          <div className="font-serif text-xl text-cocoa">Log an expense</div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Date</Label><Input data-testid="exp-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 bg-white" /></div>
            <div>
              <Label>Category</Label>
              <select data-testid="exp-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-white px-3 text-sm">
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2"><Label>Description</Label><Input data-testid="exp-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 bg-white" /></div>
            <div><Label>Amount (₹)</Label><Input data-testid="exp-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 bg-white" /></div>
            <div className="flex items-end"><Button data-testid="add-exp-btn" onClick={add} className="w-full rounded-full bg-cocoa text-cream hover:bg-cocoa-700"><Plus className="w-4 h-4 mr-2" />Add</Button></div>
          </div>
        </div>

        <div className="mt-4 kwb-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-200 text-cocoa/70">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Description</th>
                <th className="text-right p-3">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-cocoa/50">No expenses logged yet.</td></tr>}
              {items.map((e) => (
                <tr key={e.id} className="border-t border-cocoa/5">
                  <td className="p-3 text-cocoa/80">{e.date}</td>
                  <td className="p-3 text-cocoa/80 capitalize">{e.category}</td>
                  <td className="p-3 text-cocoa/80">{e.description || "—"}</td>
                  <td className="p-3 text-right font-semibold text-cocoa">₹{e.amount}</td>
                  <td className="p-3"><button data-testid={`del-exp-${e.id}`} onClick={() => del(e.id)} className="text-cocoa/50 hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
