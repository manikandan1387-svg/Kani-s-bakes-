import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import api, { formatApiError } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = ["brownies", "cakes", "cookies", "cupcakes", "eggless"];

const empty = {
  name: "", description: "", category: "brownies", price: 100,
  image_url: "", badges: "", is_eggless: false, is_available: true,
};

export default function MenuManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => {
    setLoading(true);
    api.get("/products").then((r) => setProducts(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", category: p.category, price: p.price,
      image_url: p.image_url || "", badges: (p.badges || []).join(", "),
      is_eggless: !!p.is_eggless, is_available: p.is_available !== false,
    });
    setOpen(true);
  };
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));

  const save = async () => {
    const payload = {
      ...form,
      price: Number(form.price),
      badges: form.badges.split(",").map((b) => b.trim()).filter(Boolean),
    };
    try {
      if (editing) await api.patch(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false); load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Save failed");
    }
  };

  const del = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-cocoa/60">{products.length} products</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-product-btn" onClick={openNew} className="rounded-full bg-cocoa text-cream hover:bg-cocoa-700"><Plus className="w-4 h-4 mr-2" />Add product</Button>
          </DialogTrigger>
          <DialogContent className="bg-cream border-cocoa/10 max-w-lg">
            <DialogHeader><DialogTitle className="font-serif text-2xl text-cocoa">{editing ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input data-testid="product-name" value={form.name} onChange={setField("name")} className="mt-1 bg-white" /></div>
              <div><Label>Description</Label><Textarea data-testid="product-desc" value={form.description} onChange={setField("description")} rows={2} className="mt-1 bg-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select data-testid="product-category" value={form.category} onChange={setField("category")} className="mt-1 w-full h-10 rounded-md border border-input bg-white px-3 text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Price (₹)</Label><Input data-testid="product-price" type="number" value={form.price} onChange={setField("price")} className="mt-1 bg-white" /></div>
              </div>
              <div><Label>Image URL</Label><Input data-testid="product-image" value={form.image_url} onChange={setField("image_url")} className="mt-1 bg-white" /></div>
              <div><Label>Badges (comma-separated: Bestseller, New, Eggless)</Label><Input data-testid="product-badges" value={form.badges} onChange={setField("badges")} className="mt-1 bg-white" /></div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2"><Switch checked={form.is_eggless} onCheckedChange={(v) => setForm((f) => ({ ...f, is_eggless: v }))} /> <span className="text-sm">Eggless</span></label>
                <label className="flex items-center gap-2"><Switch checked={form.is_available} onCheckedChange={(v) => setForm((f) => ({ ...f, is_available: v }))} /> <span className="text-sm">Available</span></label>
              </div>
            </div>
            <DialogFooter>
              <Button data-testid="product-save-btn" onClick={save} className="rounded-full bg-cocoa text-cream hover:bg-cocoa-700">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="text-cocoa/60">Loading…</div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="kwb-card p-4 flex gap-3">
              <img src={p.image_url} alt={p.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-cocoa truncate">{p.name}</div>
                <div className="text-xs text-cocoa/60 capitalize">{p.category} • ₹{p.price}</div>
                <div className="text-xs text-cocoa/50 mt-1">{(p.badges || []).join(" · ") || "—"}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button data-testid={`edit-${p.id}`} onClick={() => openEdit(p)} className="w-8 h-8 rounded-full hover:bg-cocoa/10 flex items-center justify-center text-cocoa"><Pencil className="w-4 h-4" /></button>
                <button data-testid={`del-${p.id}`} onClick={() => del(p)} className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
