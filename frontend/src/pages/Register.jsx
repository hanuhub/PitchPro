import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { routeFor } from "@/pages/Login";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [academies, setAcademies] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    academy_id: location.state?.academyId || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/academies").then((r) => {
      setAcademies(r.data);
      if (!form.academy_id && r.data[0]) {
        setForm((f) => ({ ...f, academy_id: r.data[0].id }));
      }
    }).catch(() => {});
    // eslint-disable-next-line
  }, []);

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.ok) {
      toast.success(`Welcome to PitchPro, ${res.user.name}!`);
      navigate(routeFor(res.user.role));
    } else {
      toast.error(res.error);
    }
  };

  const selected = academies.find((a) => a.id === form.academy_id);

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">Become a member</div>
      <h1 className="font-display text-5xl font-bold uppercase tracking-tight">Join PitchPro</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick the academy your kid trains at — your bookings, fees and progress will live there.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5" data-testid="register-form">
        <div>
          <Label className="font-display tracking-[0.2em] uppercase text-xs">Academy</Label>
          <Select value={form.academy_id} onValueChange={(v) => setForm({ ...form, academy_id: v })}>
            <SelectTrigger className="mt-2 rounded-2xl h-12" data-testid="register-academy-select">
              <SelectValue placeholder="Pick an academy" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {academies.map((a) => (
                <SelectItem key={a.id} value={a.id} className="rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.accent_color || "currentColor" }} />
                    <span>{a.name}</span>
                    <span className="text-xs text-muted-foreground">· {a.city}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="mt-2 text-xs text-muted-foreground italic">{selected.tagline || selected.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="name" className="font-display tracking-[0.2em] uppercase text-xs">Full name</Label>
          <Input id="name" required className="mt-2 rounded-2xl h-12" data-testid="register-name-input"
                 value={form.name} onChange={onChange("name")} />
        </div>
        <div>
          <Label htmlFor="email" className="font-display tracking-[0.2em] uppercase text-xs">Email</Label>
          <Input id="email" type="email" required autoComplete="email"
                 className="mt-2 rounded-2xl h-12" data-testid="register-email-input"
                 value={form.email} onChange={onChange("email")} />
        </div>
        <div>
          <Label htmlFor="phone" className="font-display tracking-[0.2em] uppercase text-xs">Phone (optional)</Label>
          <Input id="phone" className="mt-2 rounded-2xl h-12" data-testid="register-phone-input"
                 value={form.phone} onChange={onChange("phone")} placeholder="+1 555-..." />
        </div>
        <div>
          <Label htmlFor="password" className="font-display tracking-[0.2em] uppercase text-xs">Password</Label>
          <Input id="password" type="password" required minLength={6}
                 className="mt-2 rounded-2xl h-12" data-testid="register-password-input"
                 value={form.password} onChange={onChange("password")} />
        </div>
        <Button type="submit" disabled={loading}
                className="w-full rounded-full h-12 font-display tracking-[0.2em] uppercase"
                data-testid="register-submit-button">
          {loading ? "Creating…" : "Create Account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" className="text-primary font-bold tracking-wide" data-testid="link-to-login">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Don't see your academy? Email <span className="text-foreground">hello@pitchpro.app</span> to onboard.
        </p>
      </form>
    </div>
  );
}
