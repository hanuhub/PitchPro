import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, ArrowRight } from "lucide-react";

const DEMO = { email: "user@cricketacademy.com", password: "User@12345", label: "Parent Demo" };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      // Player login is parent-only. If credentials map to staff, send them to the right place.
      if (res.user.role === "platform_admin" || res.user.role === "academy_admin" || res.user.role === "admin") {
        toast.success(`Welcome, ${res.user.name.split(" ")[0]}`);
        navigate("/admin");
      } else if (res.user.role === "coach") {
        toast.success(`Welcome, ${res.user.name.split(" ")[0]}`);
        navigate("/staff");
      } else {
        toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
        navigate("/dashboard");
      }
    } else {
      toast.error(res.error);
    }
  };

  const fillDemo = () => { setEmail(DEMO.email); setPassword(DEMO.password); };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border mb-4">
        <Users className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] tracking-[0.25em] uppercase font-bold">Player &amp; Parent</span>
      </div>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight">Player sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Track your child's progress, fees, matches, and bookings.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
        <div>
          <Label htmlFor="email" className="font-display tracking-[0.2em] uppercase text-xs">Email</Label>
          <Input id="email" type="email" required autoComplete="email"
                 className="mt-2 rounded-2xl h-12" data-testid="login-email-input"
                 value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password" className="font-display tracking-[0.2em] uppercase text-xs">Password</Label>
          <Input id="password" type="password" required autoComplete="current-password"
                 className="mt-2 rounded-2xl h-12" data-testid="login-password-input"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}
                className="w-full rounded-full h-12 font-display tracking-[0.2em] uppercase"
                data-testid="login-submit-button">
          {loading ? "Signing in…" : "Sign in as parent"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-primary font-bold tracking-wide" data-testid="link-to-register">
            Join PitchPro
          </Link>
        </p>

        <button
          type="button"
          onClick={fillDemo}
          className="w-full border border-border bg-card hover:border-primary text-xs text-muted-foreground p-3 rounded-2xl transition-colors"
          data-testid="fill-demo-button"
        >
          <span className="font-display tracking-[0.2em] uppercase font-bold text-foreground">Use {DEMO.label}</span>
          <span className="block mt-1">{DEMO.email}</span>
        </button>
      </form>

      <div className="mt-10 panel-soft p-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground">Academy staff?</div>
          <div className="font-display text-lg font-bold uppercase tracking-tight">Use the academy console</div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full border-foreground/30 shrink-0" data-testid="link-to-academy-login">
          <Link to="/academy/login">Academy login <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}

export function routeFor(role) {
  if (role === "platform_admin" || role === "academy_admin" || role === "admin") return "/admin";
  if (role === "coach") return "/staff";
  return "/dashboard";
}
