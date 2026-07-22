import React, { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/api/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function BroadcastPanel() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) return toast.error("Type a message first");
    setSending(true);
    try {
      const { data } = await api.post("/admin/broadcast", { message });
      toast.success(`Broadcast queued to ${data.sent_to} customers`);
      setMessage("");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed");
    } finally { setSending(false); }
  };

  return (
    <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
      <div className="kwb-card p-6">
        <div className="font-serif text-xl text-cocoa">Broadcast to recent customers</div>
        <p className="text-sm text-cocoa/60 mt-1">Sends a WhatsApp message to every customer who's placed an order.</p>
        <Textarea data-testid="broadcast-input" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Warm brownies fresh from the oven this weekend — pre-orders open!" className="mt-4 bg-white" />
        <Button data-testid="broadcast-send-btn" onClick={send} disabled={sending} className="mt-4 rounded-full bg-cocoa text-cream hover:bg-cocoa-700"><Send className="w-4 h-4 mr-2" />Send broadcast</Button>
      </div>
      <div className="kwb-card p-6 bg-peach/20">
        <MessageSquare className="w-6 h-6 text-cocoa" />
        <div className="font-serif text-lg text-cocoa mt-3">Twilio is MOCKED</div>
        <p className="text-sm text-cocoa/70 mt-2 leading-relaxed">
          WhatsApp sends are logged on the backend for now. Add real Twilio credentials in <span className="font-mono text-xs">backend/.env</span> to go live.
        </p>
      </div>
    </div>
  );
}
