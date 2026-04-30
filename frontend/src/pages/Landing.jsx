import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, BarChart3, Trophy, MapPin } from "lucide-react";

const HERO_BG = "https://images.pexels.com/photos/36741130/pexels-photo-36741130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const ACTION_IMG = "https://images.pexels.com/photos/30671893/pexels-photo-30671893.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const BALL_IMG = "https://images.pexels.com/photos/30401509/pexels-photo-30401509.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Cricket stadium under floodlights" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 pt-20 pb-32 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 animate-fade-up">
            <div className="text-xs tracking-[0.4em] uppercase font-bold text-primary mb-6">
              ◆ Est. 2014 — Crease Cricket Academy
            </div>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter">
              Train like<br/>
              <span className="text-primary">a champion</span>.<br/>
              Play like one.
            </h1>
            <p className="mt-8 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Book practice lanes, schedule 1-on-1 sessions with elite coaches, track player progress
              and join weekend matches — all in one place.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-sm font-display tracking-[0.2em] uppercase font-bold text-sm" data-testid="hero-book-lane-button">
                <Link to="/book">Book a Lane <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-sm font-display tracking-[0.2em] uppercase font-bold text-sm border-foreground/30" data-testid="hero-join-button">
                <Link to="/register">Join Academy</Link>
              </Button>
            </div>
          </div>
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 animate-fade-up stagger-2 opacity-0">
            <Stat label="Active Players" value="320+" />
            <Stat label="Pro Coaches" value="08" />
            <Stat label="Lanes" value="05" />
            <Stat label="Trophies" value="14" />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-border bg-card overflow-hidden">
        <div className="flex gap-12 py-5 animate-marquee whitespace-nowrap font-display font-black uppercase text-2xl tracking-tight">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12 text-muted-foreground">
              Train Like A Pro
              <span className="text-primary">●</span>
              High Performance
              <span className="text-primary">●</span>
              Elite Coaching
              <span className="text-primary">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES BENTO */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-2">— What we offer</div>
            <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight">Everything you need.<br/>Nothing you don't.</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <FeatureCard
            className="md:col-span-3 md:row-span-2"
            tone="primary"
            icon={<Calendar className="h-6 w-6" />}
            title="Lane Booking"
            description="Pick your lane, pick your time. Modify or cancel up to 24 hours before. Indoor turf, spin tracks and bowling-machine lanes — all bookable in seconds."
            cta={{ to: "/book", text: "Book Now" }}
            background={ACTION_IMG}
            big
          />
          <FeatureCard
            className="md:col-span-3"
            icon={<Users className="h-6 w-6" />}
            title="1-on-1 Coaching"
            description="Book elite coaches by sport-specialty and availability."
            cta={{ to: "/coaching", text: "Schedule" }}
          />
          <FeatureCard
            className="md:col-span-3"
            icon={<BarChart3 className="h-6 w-6" />}
            title="Kids Progress Tracker"
            description="Weekly & monthly performance reports — straight to your inbox."
            cta={{ to: "/dashboard", text: "View Reports" }}
          />
          <FeatureCard
            className="md:col-span-2"
            icon={<Trophy className="h-6 w-6" />}
            title="Weekend Games"
            description="Sat–Sun fixtures with team rosters & ground GPS."
            cta={{ to: "/games", text: "View Schedule" }}
          />
          <FeatureCard
            className="md:col-span-2"
            icon={<MapPin className="h-6 w-6" />}
            title="Ground Locations"
            description="GPS pinned grounds with one-tap directions."
          />
          <FeatureCard
            className="md:col-span-2"
            tone="secondary"
            icon={<Trophy className="h-6 w-6" />}
            title="Award-winning"
            description="Best Junior Academy 2024 & Excellence in Coaching 2023."
            cta={{ to: "/about", text: "Our Story" }}
          />
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative border-y border-border overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img src={BALL_IMG} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-20 text-center">
          <h3 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight">
            Ready to step on the pitch?
          </h3>
          <p className="mt-4 text-muted-foreground">Join hundreds of players sharpening their game with Crease.</p>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-sm font-display tracking-[0.2em] uppercase font-bold" data-testid="cta-strip-register">
              <Link to="/register">Become a member <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border border-border bg-card/60 backdrop-blur p-5">
      <div className="font-display text-4xl font-black">{value}</div>
      <div className="mt-1 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({ className = "", icon, title, description, cta, background, tone, big }) {
  const toneCls = tone === "primary"
    ? "border-primary/40 hover:border-primary"
    : tone === "secondary"
      ? "border-secondary/40 hover:border-secondary"
      : "border-border hover:border-foreground/40";
  return (
    <div className={`group relative overflow-hidden border ${toneCls} bg-card transition-all duration-200 hover:-translate-y-1 ${className}`}>
      {background && (
        <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity">
          <img src={background} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
      )}
      <div className={`relative p-6 ${big ? "md:p-10 md:min-h-[420px]" : "min-h-[200px]"} flex flex-col justify-between`}>
        <div>
          <div className={`inline-grid place-items-center h-10 w-10 rounded-sm ${tone === "primary" ? "bg-primary/15 text-primary" : tone === "secondary" ? "bg-secondary/15 text-secondary" : "bg-muted text-foreground"}`}>
            {icon}
          </div>
          <h3 className={`mt-5 font-display font-black uppercase tracking-tight ${big ? "text-4xl md:text-5xl" : "text-2xl"}`}>{title}</h3>
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
