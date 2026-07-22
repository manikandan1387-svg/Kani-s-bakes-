import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, LayoutDashboard, Cookie, MessageSquare, Wallet, Send, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/pages/admin/KanbanBoard";
import MenuManager from "@/pages/admin/MenuManager";
import ReviewsManager from "@/pages/admin/ReviewsManager";
import ExpensesManager from "@/pages/admin/ExpensesManager";
import BroadcastPanel from "@/pages/admin/BroadcastPanel";

function KpiCard({ label, value, hint }) {
  return (
    <div className="kwb-card p-5">
      <div className="text-xs uppercase tracking-widest text-cocoa/50">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold text-cocoa">{value}</div>
      {hint && <div className="text-xs text-cocoa/50 mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = () => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch((e) => toast.error(formatApiError(e.response?.data?.detail) || "Failed to load stats"));
  };

  useEffect(() => { loadStats(); }, [refreshKey]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-10 animate-fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Admin dashboard</div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-cocoa mt-2">Hi Kani 👋</h1>
          <p className="text-cocoa/60 mt-1">Manage orders, menu, reviews and finances.</p>
        </div>
        <Button data-testid="admin-logout-btn" variant="outline" onClick={async () => { await logout(); nav("/"); }} className="rounded-full border-cocoa/20 text-cocoa hover:bg-cocoa hover:text-cream">
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>

      {/* KPI STRIP */}
      <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-4">
        <KpiCard label="Orders today" value={stats?.orders_today ?? "—"} hint={`₹${stats?.revenue_today ?? 0} today`} />
        <KpiCard label="Pending" value={stats?.pending ?? "—"} hint="New → Out for delivery" />
        <KpiCard label="Avg rating" value={stats ? `${stats.avg_rating || 0}★` : "—"} hint={`${stats?.review_count || 0} reviews`} />
        <KpiCard label="Revenue (delivered)" value={stats ? `₹${stats.revenue_total}` : "—"} hint={`Est. profit ₹${stats?.profit_estimate || 0}`} />
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList data-testid="admin-tabs" className="bg-white border border-cocoa/10 rounded-full p-1 h-auto flex flex-wrap">
          <TabsTrigger value="orders" data-testid="tab-orders" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4"><LayoutDashboard className="w-4 h-4 mr-2" />Orders</TabsTrigger>
          <TabsTrigger value="menu" data-testid="tab-menu" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4"><Cookie className="w-4 h-4 mr-2" />Menu</TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4"><MessageSquare className="w-4 h-4 mr-2" />Reviews</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4"><Wallet className="w-4 h-4 mr-2" />P&L</TabsTrigger>
          <TabsTrigger value="broadcast" data-testid="tab-broadcast" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4"><Send className="w-4 h-4 mr-2" />Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6"><KanbanBoard onChanged={() => setRefreshKey((k) => k + 1)} /></TabsContent>
        <TabsContent value="menu" className="mt-6"><MenuManager /></TabsContent>
        <TabsContent value="reviews" className="mt-6"><ReviewsManager /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesManager onChanged={() => setRefreshKey((k) => k + 1)} /></TabsContent>
        <TabsContent value="broadcast" className="mt-6"><BroadcastPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
