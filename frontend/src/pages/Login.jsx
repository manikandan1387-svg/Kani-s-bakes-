import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email.trim().toLowerCase(), password);
      toast.success(`Welcome back, ${u.name}`);
      const from = loc.state?.from;
      if (u.role === "admin") nav("/admin");
      else nav(from || "/");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16 animate-fade-up">
      <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Sign in</div>
      <h1 className="font-serif text-4xl font-semibold text-cocoa mt-3">Welcome back</h1>
      <p className="text-cocoa/60 mt-2">Track past orders, re-order favourites and skip the checkout typing.</p>

      <form onSubmit={submit} className="kwb-card p-6 mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-white" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-white" required />
        </div>
        <Button data-testid="login-submit-btn" disabled={loading} type="submit" className="w-full rounded-full bg-cocoa text-cream hover:bg-cocoa-700 h-11">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
        </Button>
        <div className="text-center text-sm text-cocoa/60">
          New here? <Link to="/register" data-testid="link-register" className="text-cocoa font-semibold underline underline-offset-2">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
