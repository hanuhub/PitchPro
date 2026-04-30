import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.ok) {
      toast.success(`Welcome to Crease, ${res.user.name}!`);
      navigate("/dashboard");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">Become a member</div>
      <h1 className="font-display text-5xl font-black uppercase tracking-tight">Join the academy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create your account in under a minute.</p>

      <form onSubmit={submit} className="mt-10 space-y-5" data-testid="register-form">
        <div>
          <Label htmlFor="name" className="font-display tracking-[0.2em] uppercase text-xs">Full name</Label>
          <Input id="name" required className="mt-2 rounded-sm" data-testid="register-name-input"
                 value={form.name} onChange={onChange("name")} />
        </div>
        <div>
          <Label htmlFor="email" className="font-display tracking-[0.2em] uppercase text-xs">Email</Label>
          <Input id="email" type="email" required autoComplete="email"
                 className="mt-2 rounded-sm" data-testid="register-email-input"
                 value={form.email} onChange={onChange("email")} />
        </div>
        <div>
          <Label htmlFor="phone" className="font-display tracking-[0.2em] uppercase text-xs">Phone (optional)</Label>
          <Input id="phone" className="mt-2 rounded-sm" data-testid="register-phone-input"
                 value={form.phone} onChange={onChange("phone")} placeholder="+1 555-..." />
        </div>
        <div>
          <Label htmlFor="password" className="font-display tracking-[0.2em] uppercase text-xs">Password</Label>
          <Input id="password" type="password" required minLength={6}
                 className="mt-2 rounded-sm" data-testid="register-password-input"
                 value={form.password} onChange={onChange("password")} />
        </div>
        <Button type="submit" disabled={loading}
                className="w-full rounded-sm font-display tracking-[0.2em] uppercase"
                data-testid="register-submit-button">
          {loading ? "Creating…" : "Create Account"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" className="text-primary font-bold tracking-wide" data-testid="link-to-login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
