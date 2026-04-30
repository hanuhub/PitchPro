import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Building2, ShieldCheck } from "lucide-react";

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
    demo: { email: "hello@boundaryline.in", password: "AcaAdmin@1", label: "Boundary Line Admin" },
  },
  platform: {
    title: "Platform sign in",
    sub: "Cross-academy administration — manage all academies on PitchPro.",
    cta: "Sign in as platform admin",
    demo: { email: "admin@cricketacademy.com", password: "Admin@12345", label: "Platform Admin" },
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
      <div className="mt-6 grid grid-cols-3 border border-border bg-card rounded-full overflow-hidden p-1" data-testid="login-role-toggle">
        <button
          type="button"
          onClick={() => setMode("parent")}
          data-testid="login-role-parent"
          className={`px-2 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-display tracking-[0.18em] uppercase font-bold transition-colors rounded-full ${
            mode === "parent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3.5 w-3.5" /> Parent
        </button>
        <button
          type="button"
          onClick={() => setMode("academy")}
          data-testid="login-role-academy"
          className={`px-2 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-display tracking-[0.18em] uppercase font-bold transition-colors rounded-full ${
            mode === "academy" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" /> Academy
        </button>
        <button
          type="button"
          onClick={() => setMode("platform")}
          data-testid="login-role-platform"
          className={`px-2 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-display tracking-[0.18em] uppercase font-bold transition-colors rounded-full ${
            mode === "platform" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Platform
        </button>
      </div>

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
          className="w-full border border-border bg-card hover:border-primary text-xs text-muted-foreground p-3 rounded-2xl transition-colors"
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
  if (role === "platform_admin" || role === "academy_admin" || role === "admin") return "/admin";
  if (role === "coach") return "/staff";
  return "/dashboard";
}
