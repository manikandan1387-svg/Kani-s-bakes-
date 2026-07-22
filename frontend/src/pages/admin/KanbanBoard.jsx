import React, { useEffect, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { toast } from "sonner";
import { Phone, MapPin, StickyNote } from "lucide-react";
import api, { formatApiError } from "@/api/client";

const COLUMNS = [
  { key: "new", label: "New" },
  { key: "baking", label: "Baking" },
  { key: "packed", label: "Packed" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function OrderCard({ order, dragging }) {
  return (
    <div
      data-testid={`kanban-card-${order.order_code}`}
      className={`kwb-card p-4 select-none cursor-grab active:cursor-grabbing ${dragging ? "shadow-warm scale-[1.02]" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-serif text-base font-semibold text-cocoa">{order.order_code}</div>
          <div className="text-xs text-cocoa/60">{order.customer_name}</div>
        </div>
        <div className="text-sm font-semibold text-cocoa">₹{order.total}</div>
      </div>
      <div className="mt-3 text-xs text-cocoa/70 space-y-1">
        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {order.customer_phone}</div>
        <div className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{order.address}</span></div>
        {order.notes && <div className="flex items-start gap-1.5"><StickyNote className="w-3 h-3 mt-0.5" /> <span className="italic line-clamp-2">{order.notes}</span></div>}
      </div>
      <div className="mt-3 pt-3 border-t border-cocoa/10 text-xs text-cocoa/60">
        {order.items.slice(0, 2).map((i, idx) => (
          <div key={idx} className="truncate">• {i.quantity} × {i.name}</div>
        ))}
        {order.items.length > 2 && <div className="text-cocoa/40">+ {order.items.length - 2} more</div>}
      </div>
    </div>
  );
}

function DraggableCard({ order }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id, data: { order } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.35 : 1 }}>
      <OrderCard order={order} />
    </div>
  );
}

function DroppableColumn({ colKey, label, orders }) {
  const { isOver, setNodeRef } = useDroppable({ id: colKey });
  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-col-${colKey}`}
      className={`w-72 flex-shrink-0 rounded-2xl border p-3 transition-colors ${
        isOver ? "border-peach bg-peach/10" : "border-cocoa/10 bg-cream-200/50"
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="font-serif text-lg font-semibold text-cocoa">{label}</div>
        <span className="text-xs font-semibold text-cocoa/50 bg-white rounded-full px-2 py-0.5">{orders.length}</span>
      </div>
      <div className="space-y-3 min-h-24">
        {orders.length === 0 ? (
          <div className="text-xs text-cocoa/40 text-center py-6 border border-dashed border-cocoa/15 rounded-xl">Drop here</div>
        ) : orders.map((o) => <DraggableCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

export default function KanbanBoard({ onChanged }) {
  const [orders, setOrders] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const load = () => {
    api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const byCol = COLUMNS.reduce((acc, c) => { acc[c.key] = orders.filter((o) => o.status === c.key); return acc; }, {});

  const active = activeId ? orders.find((o) => o.id === activeId) : null;

  const onDragEnd = async (event) => {
    setActiveId(null);
    const { active: a, over } = event;
    if (!a || !over) return;
    const overCol = over.id;
    const order = orders.find((o) => o.id === a.id);
    if (!order || order.status === overCol) return;
    if (!COLUMNS.find((c) => c.key === overCol)) return;
    const prevStatus = order.status;
    setOrders((prev) => prev.map((o) => (o.id === a.id ? { ...o, status: overCol } : o)));
    try {
      await api.patch(`/orders/${a.id}/status`, { status: overCol });
      toast.success(`${order.order_code} → ${overCol.replace(/_/g, " ")}`);
      onChanged && onChanged();
    } catch (e) {
      setOrders((prev) => prev.map((o) => (o.id === a.id ? { ...o, status: prevStatus } : o)));
      toast.error(formatApiError(e.response?.data?.detail) || "Failed to update status");
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto kwb-scrollbar pb-3">
        {COLUMNS.map((c) => <DroppableColumn key={c.key} colKey={c.key} label={c.label} orders={byCol[c.key] || []} />)}
      </div>
      <DragOverlay>{active ? <OrderCard order={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
