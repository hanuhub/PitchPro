import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ShieldCheck, ArrowRight } from "lucide-react";

const ROLE_HINT = {
  academy: {
    title: "Academy console",
    sub: "Operations dashboard — lanes, coaches, fees, players, announcements.",
    cta: "Sign in to academy",
    demo: { email: "hello@pyaremohan.in", password: "AcaAdmin@1", label: "Pyare Mohan Admin" },
  },
  platform: {
    title: "Platform console",
    sub: "Cross-academy administration — manage every academy on PitchPro.",
    cta: "Sign in to platform",
    demo: { email: "admin@cricketacademy.com", password: "Admin@12345", label: "Platform Admin" },
  },
};

export default function AcademyLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("academy");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      const role = res.user.role;
      // Route based on the user's actual role (regardless of which tab they used).
      if (role === "platform_admin" || role === "academy_admin" || role === "admin") {
        toast.success(`Welcome, ${res.user.name.split(" ")[0]}`);
        navigate("/admin");
      } else if (role === "coach") {
        toast.success(`Welcome, ${res.user.name.split(" ")[0]}`);
        navigate("/staff");
      } else {
        // Parent accidentally logged in here — bounce to player dashboard.
        toast.success(`Welcome back, ${res.user.name.split(" ")[0]}`);
        navigate("/dashboard");
      }
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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border mb-4">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] tracking-[0.25em] uppercase font-bold">Staff access</span>
      </div>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight">{hint.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{hint.sub}</p>

      {/* Role toggle */}
      <div className="mt-6 grid grid-cols-2 border border-border bg-card rounded-full overflow-hidden p-1" data-testid="academy-login-role-toggle">
        <button
          type="button"
          onClick={() => setMode("academy")}
          data-testid="academy-login-role-academy"
          className={`px-3 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-display tracking-[0.18em] uppercase font-bold transition-colors rounded-full ${
            mode === "academy" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" /> Academy
        </button>
        <button
          type="button"
          onClick={() => setMode("platform")}
          data-testid="academy-login-role-platform"
          className={`px-3 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-display tracking-[0.18em] uppercase font-bold transition-colors rounded-full ${
            mode === "platform" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Platform
        </button>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5" data-testid="academy-login-form">
        <div>
          <Label htmlFor="email" className="font-display tracking-[0.2em] uppercase text-xs">Work email</Label>
          <Input id="email" type="email" required autoComplete="email"
                 className="mt-2 rounded-2xl h-12" data-testid="academy-login-email-input"
                 value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@academy.com" />
        </div>
        <div>
          <Label htmlFor="password" className="font-display tracking-[0.2em] uppercase text-xs">Password</Label>
          <Input id="password" type="password" required autoComplete="current-password"
                 className="mt-2 rounded-2xl h-12" data-testid="academy-login-password-input"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}
                className="w-full rounded-full h-12 font-display tracking-[0.2em] uppercase"
                data-testid="academy-login-submit-button">
          {loading ? "Signing in…" : hint.cta}
        </Button>

        <button
          type="button"
          onClick={fillDemo}
          className="w-full border border-border bg-card hover:border-primary text-xs text-muted-foreground p-3 rounded-2xl transition-colors"
          data-testid="academy-fill-demo-button"
        >
          <span className="font-display tracking-[0.2em] uppercase font-bold text-foreground">Use demo {hint.demo.label}</span>
          <span className="block mt-1">{hint.demo.email}</span>
        </button>
      </form>

      <div className="mt-10 panel-soft p-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground">Are you a parent?</div>
          <div className="font-display text-lg font-bold uppercase tracking-tight">Player sign-in here</div>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full border-foreground/30 shrink-0" data-testid="link-to-player-login">
          <Link to="/login">Player login <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}
