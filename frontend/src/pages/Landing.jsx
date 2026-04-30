import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, BarChart3, Trophy, MapPin, Sparkles, Building2, ChevronRight } from "lucide-react";

const HERO_BG = "https://images.pexels.com/photos/36741130/pexels-photo-36741130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const ACTION_IMG = "https://images.pexels.com/photos/30671893/pexels-photo-30671893.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Landing() {
  const [academies, setAcademies] = useState([]);
  useEffect(() => { api.get("/academies").then((r) => setAcademies(r.data)).catch(() => {}); }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Cricket stadium" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 pt-24 pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border mb-7">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] tracking-[0.25em] uppercase font-bold">The cricket academy platform</span>
          </div>

          <h1 className="font-display text-6xl sm:text-7xl lg:text-[8rem] font-bold uppercase leading-[0.9] tracking-tighter max-w-5xl">
            One platform.<br/>
            <span className="text-primary">Every academy.</span><br/>
            Every player.
          </h1>
          <p className="mt-8 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
            PitchPro powers cricket academies with lane bookings, 1-on-1 coaching, kids' progress tracking,
            weekend matches, and parent communication — under one roof, on every device.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7 font-display tracking-[0.2em] uppercase font-bold text-sm" data-testid="hero-find-academy">
              <Link to="#academies">Find your academy <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7 font-display tracking-[0.2em] uppercase font-bold text-sm border-foreground/30" data-testid="hero-list-academy">
              <Link to="/register">List your academy</Link>
            </Button>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Stat label="Academies" value={academies.length || "03"} />
            <Stat label="Active players" value="320+" />
            <Stat label="Pro coaches" value="08" />
            <Stat label="Trophies" value="14" />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-border bg-card overflow-hidden">
        <div className="flex gap-12 py-5 animate-marquee whitespace-nowrap font-display font-bold uppercase text-2xl tracking-tight">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12 text-muted-foreground">
              For Academy Owners
              <span className="text-primary">●</span>
              For Coaches
              <span className="text-primary">●</span>
              For Parents
              <span className="text-primary">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURED ACADEMIES */}
      <section id="academies" className="mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-2">— On the platform</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">Featured academies</h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Browse academies live on PitchPro. Sign up with the academy your kid trains at — they'll see your
              bookings, sessions, fees and progress reports automatically.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full px-6 border-foreground/30">
            <Link to="/register" data-testid="academies-join-cta">Join one <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="academies-grid">
          {academies.map((a, i) => (
            <article key={a.id} className="group panel-glow overflow-hidden transition-all duration-200 hover:-translate-y-1">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img src={a.photo_url} alt={a.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 backdrop-blur border border-border text-[10px] tracking-[0.25em] uppercase font-bold">
                  <span className="h-2 w-2 rounded-full" style={{ background: a.accent_color || "hsl(var(--primary))" }} />
                  Active
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">{a.city || "Sportsville"}</div>
                  <h3 className="font-display text-3xl font-bold uppercase tracking-tight mt-1">{a.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Players" value={a.players_count || 0} />
                  <MiniStat label="Lanes" value={a.lanes_count || 0} />
                  <MiniStat label="Coaches" value={a.coaches_count || 0} />
                </div>
                <Link
                  to="/register"
                  state={{ academyId: a.id }}
                  data-testid={`academy-card-${a.slug}`}
                  className="mt-5 inline-flex items-center gap-2 font-display tracking-[0.2em] uppercase text-sm font-bold text-primary hover:text-foreground transition-colors"
                >
                  Sign up here <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
          {academies.length === 0 && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel-soft aspect-[5/4] animate-pulse" />
          ))}
        </div>
      </section>

      {/* MODULES (rounded bento) */}
      <section id="modules" className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="mb-12">
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-2">— Built for academies</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">Everything you need.<br/>Nothing you don't.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <ModuleCard
            big tone="primary"
            className="md:col-span-3 md:row-span-2"
            icon={<Calendar className="h-6 w-6" />}
            title="Lane Booking"
            description="Pick your lane, pick your time. Modify or cancel up to 24 hours before. Indoor turf, spin tracks and bowling-machine lanes."
            cta={{ to: "/book", text: "Book Now" }}
            background={ACTION_IMG}
          />
          <ModuleCard className="md:col-span-3" icon={<Users className="h-6 w-6" />}
                      title="1-on-1 Coaching"
                      description="Book elite coaches by sport-specialty and availability."
                      cta={{ to: "/coaching", text: "Schedule" }} />
          <ModuleCard className="md:col-span-3" icon={<BarChart3 className="h-6 w-6" />}
                      title="Kids Progress Tracker"
                      description="Weekly & monthly performance reports — straight to your inbox."
                      cta={{ to: "/dashboard", text: "View Reports" }} />
          <ModuleCard className="md:col-span-2" icon={<Trophy className="h-6 w-6" />}
                      title="Weekend Games"
                      description="Sat–Sun fixtures with team rosters & ground GPS." />
          <ModuleCard className="md:col-span-2" icon={<MapPin className="h-6 w-6" />}
                      title="Ground GPS" description="One-tap directions for every match." />
          <ModuleCard className="md:col-span-2" tone="secondary" icon={<Building2 className="h-6 w-6" />}
                      title="Multi-academy"
                      description="One platform. Many academies. Each branded, each independent." />
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-20">
        <div className="panel-glow p-12 md:p-16 text-center relative overflow-hidden" style={{ borderRadius: "2rem" }}>
          <div className="absolute inset-0 -z-0 opacity-30 pointer-events-none">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full" style={{ background: "hsl(var(--primary) / 0.4)", filter: "blur(60px)" }} />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full" style={{ background: "hsl(var(--secondary) / 0.4)", filter: "blur(60px)" }} />
          </div>
          <div className="relative">
            <h3 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight">Run an academy?</h3>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Onboard your academy onto PitchPro in minutes. Manage lanes, coaches, kids' progress and parent comms — all from one console.
            </p>
            <div className="mt-8 inline-flex">
              <Button asChild size="lg" className="rounded-full px-7 font-display tracking-[0.2em] uppercase font-bold" data-testid="cta-list-academy">
                <Link to="/register">List your academy <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel-soft p-5 backdrop-blur" style={{ borderRadius: "1.25rem" }}>
      <div className="font-display text-4xl font-bold">{value}</div>
      <div className="mt-1 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="panel-soft py-2.5">
      <div className="font-display text-xl font-bold leading-none">{value}</div>
      <div className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ModuleCard({ className = "", icon, title, description, cta, background, tone, big }) {
  const ringCls = tone === "primary"
    ? "border-primary/40 hover:border-primary"
    : tone === "secondary"
      ? "border-secondary/40 hover:border-secondary"
      : "border-border hover:border-foreground/40";
  return (
    <div className={`group relative overflow-hidden border ${ringCls} bg-card transition-all duration-200 hover:-translate-y-1 ${className}`}
         style={{ borderRadius: "1.5rem" }}>
      {background && (
        <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity">
          <img src={background} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>
      )}
      <div className={`relative p-6 ${big ? "md:p-10 md:min-h-[420px]" : "min-h-[200px]"} flex flex-col justify-between`}>
        <div>
          <div className={`inline-grid place-items-center h-11 w-11 rounded-2xl ${tone === "primary" ? "bg-primary/15 text-primary" : tone === "secondary" ? "bg-secondary/15 text-secondary" : "bg-muted text-foreground"}`}>
            {icon}
          </div>
          <h3 className={`mt-5 font-display font-bold uppercase tracking-tight ${big ? "text-4xl md:text-5xl" : "text-2xl"}`}>{title}</h3>
          <p className={`mt-2 text-sm text-muted-foreground ${big ? "max-w-md" : ""}`}>{description}</p>
        </div>
        {cta && (
          <Link to={cta.to} className="mt-6 inline-flex items-center gap-2 font-display tracking-[0.2em] uppercase text-sm font-bold text-primary hover:text-foreground transition-colors">
            {cta.text} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
