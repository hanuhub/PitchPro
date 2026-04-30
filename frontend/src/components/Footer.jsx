import { Logo } from "@/components/Logo";
import { MapPin, Clock, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Logo variant="icon" className="h-12 w-auto" />
            <div className="font-display text-3xl font-bold uppercase tracking-tight">PitchPro</div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-md">
            High-performance cricket coaching, lane bookings, weekend matches and player development — built for the next generation of cricketers.
          </p>
        </div>
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> Visit
          </div>
          <p className="mt-3 text-sm text-muted-foreground">12 Stadium Lane<br/>Sportsville</p>
        </div>
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Hours
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Mon–Fri 6 am – 10 pm<br/>Sat–Sun 7 am – 9 pm</p>
          <div className="mt-4 text-xs tracking-[0.3em] uppercase font-bold text-primary flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" /> Support
          </div>
          <p className="mt-2 text-sm text-muted-foreground">hello@pitchpro.in</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PitchPro Cricket Academy. Built for cricket lovers.
      </div>
    </footer>
  );
}
