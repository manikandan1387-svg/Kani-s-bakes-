import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Zap, Loader2, Webhook, MessageSquareText, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import api, { formatApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const SMS_SAMPLE = `Paste bank UPI-credit SMS(es). Example:

ICICI Bank: Rs. 140.00 credited to your account XXXX1234 by UPI/CR/402512345678/RAHUL K on 12-Feb-26. Available Bal: Rs. 5000.

HDFC: Rs 250.00 credited to A/c XX1234 via UPI Ref 411122223333 dt 12-02-26.`;

function copy(text) {
  if (!text) return;
  navigator.clipboard?.writeText(text);
  toast.success("Copied");
}

function SecretRow({ label, value, testid }) {
  const [show, setShow] = useState(false);
  const masked = value ? "•".repeat(Math.min(value.length, 32)) : "—";
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">{label}</div>
      <div className="flex gap-2">
        <div data-testid={testid} className="flex-1 rounded-xl bg-cream-200 px-3 py-2 text-xs font-mono text-cocoa break-all">
          {show ? value : masked}
        </div>
        <button onClick={() => setShow((s) => !s)} className="px-3 rounded-full hover:bg-cocoa/10 text-xs text-cocoa flex-shrink-0">{show ? "Hide" : "Show"}</button>
        <button aria-label="Copy" onClick={() => copy(value)} className="w-9 h-9 rounded-full hover:bg-cocoa/10 flex items-center justify-center text-cocoa flex-shrink-0"><Copy className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function UrlRow({ label, value, testid }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">{label}</div>
      <div className="flex gap-2">
        <div data-testid={testid} className="flex-1 rounded-xl bg-cream-200 px-3 py-2 text-xs font-mono text-cocoa break-all">{value}</div>
        <button aria-label="Copy" onClick={() => copy(value)} className="w-9 h-9 rounded-full hover:bg-cocoa/10 flex items-center justify-center text-cocoa flex-shrink-0"><Copy className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function ProviderTab({ id, cfg, extras }) {
  if (!cfg) return null;
  return (
    <div className="space-y-4">
      <UrlRow label="Webhook URL" value={cfg.webhook_url} testid={`webhook-url-${id}`} />
      <SecretRow label={`Webhook secret (header: ${cfg.signature_header})`} value={cfg.webhook_secret} testid={`webhook-secret-${id}`} />
      {cfg.events && (
        <div>
          <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">Events</div>
          <div className="flex flex-wrap gap-2">
            {cfg.events.map((e) => <span key={e} className="text-xs font-mono px-2 py-1 rounded-full bg-cocoa text-cream">{e}</span>)}
          </div>
        </div>
      )}
      {cfg.setup_steps && (
        <div>
          <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">Setup steps</div>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-cocoa/80">
            {cfg.setup_steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}
      {cfg.sample_payload && (
        <div>
          <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">Expected payload</div>
          <pre className="rounded-xl bg-cocoa text-cream text-[11px] font-mono p-3 overflow-x-auto">{JSON.stringify(cfg.sample_payload, null, 2)}</pre>
        </div>
      )}
      {extras}
    </div>
  );
}

export default function ReconcilePanel({ onChanged }) {
  const [cfg, setCfg] = useState(null);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/admin/reconcile/config").then((r) => setCfg(r.data)).catch(() => {});
  }, []);

  const run = async () => {
    if (!text.trim()) return toast.error("Paste at least one SMS first");
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post("/admin/reconcile/paste", { text });
      setResult(data);
      const s = data.summary;
      if (s.matched > 0) {
        toast.success(`Auto-verified ${s.matched} order${s.matched === 1 ? "" : "s"}`);
        onChanged && onChanged();
      } else if (s.parsed === 0) {
        toast.error("Couldn't find a UTR + amount in the pasted text");
      } else {
        toast(`Parsed ${s.parsed} SMS, no matches found`);
      }
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Reconcile failed");
    } finally { setRunning(false); }
  };

  const curlExample = useMemo(() => {
    if (!cfg?.generic) return "";
    return `curl -X POST "${cfg.generic.webhook_url}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: ${cfg.generic.webhook_secret}" \\
  -d '${JSON.stringify(cfg.generic.sample_payload)}'`;
  }, [cfg]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* Paste SMS */}
      <div className="kwb-card p-6">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-cocoa" />
          <div className="font-serif text-xl text-cocoa">Paste UPI SMS</div>
        </div>
        <p className="text-sm text-cocoa/60 mt-1">
          Paste one or more bank UPI-credit SMSes. We'll parse the UTR + amount and auto-verify any matching pending order.
        </p>
        <Textarea
          data-testid="reconcile-paste-input"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SMS_SAMPLE}
          className="mt-4 bg-white font-mono text-xs"
        />
        <div className="mt-3 flex gap-2">
          <Button data-testid="reconcile-run-btn" onClick={run} disabled={running} className="rounded-full bg-cocoa text-cream hover:bg-cocoa-700">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Reconcile
          </Button>
          {text && <Button variant="outline" onClick={() => { setText(""); setResult(null); }} className="rounded-full border-cocoa/20 text-cocoa">Clear</Button>}
        </div>

        {result && (
          <div className="mt-5 space-y-3 text-sm" data-testid="reconcile-result">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-900 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{result.summary.matched} matched</span>
              <span className="px-2.5 py-1 rounded-full bg-cream-200 text-cocoa font-semibold">{result.summary.parsed} parsed</span>
              {result.summary.no_match > 0 && <span className="px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-semibold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{result.summary.no_match} no-match</span>}
              {result.summary.ambiguous > 0 && <span className="px-2.5 py-1 rounded-full bg-gold/20 text-cocoa font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{result.summary.ambiguous} ambiguous</span>}
              {result.summary.already_verified > 0 && <span className="px-2.5 py-1 rounded-full bg-cocoa-100 text-cocoa font-semibold">{result.summary.already_verified} already verified</span>}
            </div>

            {result.matched.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">Verified</div>
                <ul className="space-y-1">
                  {result.matched.map((m, i) => (
                    <li key={i} className="text-cocoa"><span className="font-mono">{m.utr}</span> → <span className="font-semibold">{m.order_code}</span> · ₹{m.amount}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.no_match.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">No match</div>
                <ul className="space-y-1">
                  {result.no_match.map((m, i) => (
                    <li key={i} className="text-cocoa/70">
                      <span className="font-mono">{m.utr}</span> · ₹{m.amount} — <span className="text-cocoa/50">{m.reason}</span>
                      {m.expected_totals && <span className="text-cocoa/50"> (expected ₹{m.expected_totals.join(", ")})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.ambiguous.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">Ambiguous — verify manually</div>
                <ul className="space-y-1">
                  {result.ambiguous.map((m, i) => (
                    <li key={i} className="text-cocoa/70"><span className="font-mono">{m.utr}</span> matches {m.order_codes.join(", ")}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zero-touch webhook: provider tabs */}
      <div className="kwb-card p-6">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-cocoa" />
          <div className="font-serif text-xl text-cocoa">Zero-touch webhook</div>
        </div>
        <p className="text-sm text-cocoa/60 mt-1">
          Paste these into your provider dashboard — we accept native payloads, no mapper needed.
        </p>

        {!cfg ? <div className="text-cocoa/60 text-sm mt-4">Loading…</div> : (
          <Tabs defaultValue="razorpay" className="mt-4">
            <TabsList data-testid="provider-tabs" className="bg-cream-200 rounded-full p-1 h-auto">
              <TabsTrigger value="razorpay" data-testid="prov-razorpay" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4">Razorpay</TabsTrigger>
              <TabsTrigger value="cashfree" data-testid="prov-cashfree" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4">Cashfree</TabsTrigger>
              <TabsTrigger value="generic" data-testid="prov-generic" className="rounded-full data-[state=active]:bg-cocoa data-[state=active]:text-cream text-cocoa px-4">Generic / SMS</TabsTrigger>
            </TabsList>

            <TabsContent value="razorpay" className="mt-4">
              <ProviderTab id="razorpay" cfg={cfg.razorpay} />
            </TabsContent>
            <TabsContent value="cashfree" className="mt-4">
              <ProviderTab id="cashfree" cfg={cfg.cashfree} />
            </TabsContent>
            <TabsContent value="generic" className="mt-4">
              <ProviderTab
                id="generic"
                cfg={cfg.generic}
                extras={
                  <div>
                    <div className="text-xs uppercase tracking-widest text-cocoa/50 mb-1">Try it (curl)</div>
                    <div className="flex gap-2">
                      <pre className="flex-1 rounded-xl bg-cream-200 text-cocoa text-[11px] font-mono p-3 overflow-x-auto whitespace-pre">{curlExample}</pre>
                      <button aria-label="Copy curl" onClick={() => copy(curlExample)} className="w-9 h-9 rounded-full hover:bg-cocoa/10 flex items-center justify-center text-cocoa flex-shrink-0"><Copy className="w-4 h-4" /></button>
                    </div>
                    <p className="text-[11px] text-cocoa/50 leading-relaxed mt-2">
                      Use this URL for SMS-forwarding tools (SMSGate, Zapier, Make) or any custom integration.
                    </p>
                  </div>
                }
              />
            </TabsContent>
          </Tabs>
        )}
        <p className="text-[11px] text-cocoa/50 leading-relaxed mt-4">
          Match rule: <b>exact amount</b> + <b>UTR on a pending order</b>. Ambiguous cases (2+ orders with same UTR) are flagged for manual review.
        </p>
      </div>
    </div>
  );
}
