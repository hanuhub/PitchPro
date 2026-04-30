import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
      toast.success("Welcome back!");
      navigate(res.user.role === "admin" ? "/admin" : "/dashboard");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">Member Sign In</div>
      <h1 className="font-display text-5xl font-black uppercase tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your bookings, sessions, and player progress.</p>

      <form onSubmit={submit} className="mt-10 space-y-5" data-testid="login-form">
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
          {loading ? "Signing in…" : "Sign In"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-primary font-bold tracking-wide" data-testid="link-to-register">
            Join the academy
          </Link>
        </p>
        <div className="border border-border rounded-sm p-3 text-xs text-muted-foreground">
          <div className="font-display tracking-[0.2em] uppercase font-bold text-foreground mb-1">Demo accounts</div>
          Admin — admin@cricketacademy.com / Admin@12345<br/>
          User — user@cricketacademy.com / User@12345
        </div>
      </form>
    </div>
  );
}
