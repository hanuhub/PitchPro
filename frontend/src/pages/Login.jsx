import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Building2 } from "lucide-react";

const ROLE_HINT = {
  parent: {
    title: "Parent sign in",
    sub: "Track your child's progress, fees, matches, and bookings.",
    cta: "Sign in as parent",
    demo: { email: "user@cricketacademy.com", password: "User@12345", label: "Parent" },
  },
  academy: {
    title: "Academy sign in",
    sub: "Operations dashboard — lanes, coaches, fees, players, announcements.",
    cta: "Sign in as academy staff",
    demo: { email: "admin@cricketacademy.com", password: "Admin@12345", label: "Admin" },
  },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
      navigate(routeFor(res.user.role));
    } else {
      toast.error(res.error);
    }
  };

  const fillDemo = () => {
    const d = ROLE_HINT[mode].demo;
    setEmail(d.email); setPassword(d.password);
  };

  const hint = ROLE_HINT[mode];

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">PitchPro Members</div>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight">{hint.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{hint.sub}</p>

      {/* Role toggle */}
      <div className="mt-6 grid grid-cols-2 border border-border bg-card rounded-sm overflow-hidden" data-testid="login-role-toggle">
        <button
          type="button"
          onClick={() => setMode("parent")}
          data-testid="login-role-parent"
          className={`px-3 py-3 flex items-center justify-center gap-2 text-xs font-display tracking-[0.2em] uppercase font-bold transition-colors ${
            mode === "parent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" /> Parent
        </button>
        <button
          type="button"
          onClick={() => setMode("academy")}
          data-testid="login-role-academy"
          className={`px-3 py-3 flex items-center justify-center gap-2 text-xs font-display tracking-[0.2em] uppercase font-bold transition-colors ${
            mode === "academy" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" /> Academy
        </button>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
        <div>
          <Label htmlFor="email" className="font-display tracking-[0.2em] uppercase text-xs">Email</Label>
          <Input id="email" type="email" required autoComplete="email"
                 className="mt-2 rounded-sm" data-testid="login-email-input"
                 value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password" className="font-display tracking-[0.2em] uppercase text-xs">Password</Label>
          <Input id="password" type="password" required autoComplete="current-password"
                 className="mt-2 rounded-sm" data-testid="login-password-input"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}
                className="w-full rounded-sm font-display tracking-[0.2em] uppercase"
                data-testid="login-submit-button">
          {loading ? "Signing in…" : hint.cta}
        </Button>
        {mode === "parent" && (
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="text-primary font-bold tracking-wide" data-testid="link-to-register">
              Join PitchPro
            </Link>
          </p>
        )}
        <button
          type="button"
          onClick={fillDemo}
          className="w-full border border-border bg-card hover:border-primary text-xs text-muted-foreground p-3 rounded-sm transition-colors"
          data-testid="fill-demo-button"
        >
          <span className="font-display tracking-[0.2em] uppercase font-bold text-foreground">Use demo {hint.demo.label}</span>
          <span className="block mt-1">{hint.demo.email}</span>
        </button>
      </form>
    </div>
  );
}

export function routeFor(role) {
  if (role === "admin") return "/admin";
  if (role === "coach") return "/staff";
  return "/dashboard";
}
