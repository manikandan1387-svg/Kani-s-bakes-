import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      toast.success("Account created!");
      nav("/");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16 animate-fade-up">
      <div className="text-xs uppercase tracking-[0.25em] text-peach-700 font-semibold">Create account</div>
      <h1 className="font-serif text-4xl font-semibold text-cocoa mt-3">Join the sweet list</h1>
      <p className="text-cocoa/60 mt-2">Order faster, track easily, get first dibs on new bakes.</p>

      <form onSubmit={submit} className="kwb-card p-6 mt-8 space-y-4">
        <div>
          <Label htmlFor="rname">Name</Label>
          <Input id="rname" data-testid="register-name" value={form.name} onChange={setField("name")} required className="mt-1.5 bg-white" />
        </div>
        <div>
          <Label htmlFor="remail">Email</Label>
          <Input id="remail" data-testid="register-email" type="email" value={form.email} onChange={setField("email")} required className="mt-1.5 bg-white" />
        </div>
        <div>
          <Label htmlFor="rphone">Phone (optional)</Label>
          <Input id="rphone" data-testid="register-phone" value={form.phone} onChange={setField("phone")} className="mt-1.5 bg-white" />
        </div>
        <div>
          <Label htmlFor="rpass">Password</Label>
          <Input id="rpass" data-testid="register-password" type="password" value={form.password} onChange={setField("password")} required className="mt-1.5 bg-white" />
        </div>
        <Button data-testid="register-submit-btn" disabled={loading} type="submit" className="w-full rounded-full bg-cocoa text-cream hover:bg-cocoa-700 h-11">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
        </Button>
        <div className="text-center text-sm text-cocoa/60">
          Already have an account? <Link to="/login" data-testid="link-login" className="text-cocoa font-semibold underline underline-offset-2">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
