import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, BarChart3, Trophy, MapPin, ChevronLeft } from "lucide-react";

/* ----- Cream & Pitch palette (sporty + warm) ----- */
const C = {
  bg: "#F4EFE6",
  surface: "#FBF8F1",
  surface2: "#E9E1D0",
  fg: "#2C3624",
  fgMuted: "#6B6E5E",
  primary: "#7A9B6E",     // forest sage
  primaryDark: "#5A7951",
  accent: "#C2826E",      // dusty red / brick
  cream: "#EFE4CD",
  ink: "#1F2419",
  border: "#D8CEB8",
};

const HERO_IMG = "https://images.pexels.com/photos/30671893/pexels-photo-30671893.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const COACH_IMG = "https://images.unsplash.com/photo-1593766788306-28561086694e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85";
const BALL_IMG = "https://images.pexels.com/photos/30401509/pexels-photo-30401509.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function ThemePitch() {
  return (
    <div style={{ background: C.bg, color: C.fg }} data-testid="theme-pitch" className="min-h-screen">
      <Header c={C} />

      {/* HERO — magazine cover */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 md:px-8 pt-12 pb-16 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 grid grid-cols-12 gap-3 items-end mb-6">
            <div className="col-span-6 md:col-span-3 text-[11px] tracking-[0.4em] uppercase font-bold" style={{ color: C.primary }}>
              ◆ Vol. 26 · Spring '26
            </div>
            <div className="col-span-6 md:col-span-6 text-[11px] tracking-[0.3em] uppercase text-center" style={{ color: C.fgMuted }}>
              The cricket academy field journal
            </div>
            <div className="col-span-12 md:col-span-3 text-[11px] tracking-[0.3em] uppercase font-bold md:text-right" style={{ color: C.fgMuted }}>
              Sportsville
            </div>
          </div>
          <div className="col-span-12">
            <div className="border-t-2 border-b" style={{ borderColor: C.fg + "60" }}></div>
          </div>

          <div className="lg:col-span-7 pt-8">
            <h1 className="font-display text-6xl sm:text-7xl lg:text-[8rem] font-bold uppercase leading-[0.85] tracking-tighter">
              Train like<br/>
              <span style={{ color: C.primary }}>a champion</span>.<br/>
              <span style={{ color: C.accent }}>Play</span> like one.
            </h1>
            <p className="mt-8 max-w-xl text-base md:text-lg leading-relaxed" style={{ color: C.fgMuted }}>
              Book practice lanes, schedule 1-on-1 sessions with elite coaches, track player progress
              and join weekend matches — all in one place.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Btn c={C} primary>Book a Lane <ArrowRight className="ml-2 h-4 w-4" /></Btn>
              <Btn c={C}>Meet the Coaches</Btn>
            </div>
          </div>
          <div className="lg:col-span-5 pt-8">
            <div className="relative">
              <img src={HERO_IMG} alt="" className="w-full aspect-[4/5] object-cover" style={{ borderRadius: 4, filter: "saturate(0.9)" }} />
              <div className="absolute -bottom-3 -right-3 px-4 py-3" style={{ background: C.accent, color: "#fff", borderRadius: 4 }}>
                <div className="text-[10px] tracking-[0.3em] uppercase font-bold">— Cover story</div>
                <div className="font-display text-xl font-bold uppercase mt-0.5">Pace, Patience, Pride</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-4 gap-3">
              {[["320+", "Players"], ["08", "Coaches"], ["05", "Lanes"], ["14", "Trophies"]].map(([v, l]) => (
                <div key={l} className="p-3 text-center" style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4 }}>
                  <div className="font-display text-2xl font-bold leading-none" style={{ color: C.primary }}>{v}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase mt-1.5" style={{ color: C.fgMuted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RUNNING TICKER */}
      <div className="border-y-2" style={{ borderColor: C.fg, background: C.fg, color: C.cream }}>
        <div className="flex gap-12 py-3 whitespace-nowrap font-display font-bold uppercase text-xl tracking-tight animate-marquee">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12">
              Train Like A Pro
              <span style={{ color: C.primary }}>●</span>
              High Performance
              <span style={{ color: C.accent }}>●</span>
              Elite Coaching
              <span style={{ color: C.primary }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES — pitch-card grid */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-20">
        <div className="grid lg:grid-cols-12 gap-3 mb-12 items-end">
          <div className="lg:col-span-7">
            <div className="text-[11px] tracking-[0.3em] uppercase font-bold mb-2" style={{ color: C.primary }}>— Featured</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
              Modules that move the needle
            </h2>
          </div>
          <div className="lg:col-span-5 text-sm" style={{ color: C.fgMuted }}>
            Five focused tools — booking, coaching, progress, games, and announcements — built into one
            calm place.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <FeatureBig c={C} className="md:col-span-4 md:row-span-2" img={HERO_IMG}
                      icon={<Calendar />}
                      title="Lane Booking"
                      desc="Pick your lane. Pick your time. Modify or cancel up to 24 hours before." />
          <Feature c={C} className="md:col-span-2" icon={<Users />} title="1-on-1 Coaching"
                   desc="Book elite coaches by sport-specialty and availability." />
          <Feature c={C} className="md:col-span-2" icon={<BarChart3 />} title="Progress Reports"
                   desc="Weekly & monthly reports — straight to your inbox." />
          <Feature c={C} className="md:col-span-3" tone="accent" icon={<Trophy />}
                   title="Weekend Games"
                   desc="Sat–Sun fixtures with team rosters & ground GPS." />
          <Feature c={C} className="md:col-span-3" icon={<MapPin />} title="Ground Locations"
                   desc="GPS-pinned grounds with one-tap directions." />
        </div>
      </section>

      {/* COACH ROW */}
      <section className="border-y" style={{ background: C.surface, borderColor: C.border }}>
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-4">
              <div className="text-[11px] tracking-[0.3em] uppercase font-bold" style={{ color: C.primary }}>— Our team</div>
              <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">Coached by champions.</h2>
              <p className="mt-4 text-sm" style={{ color: C.fgMuted }}>
                Former first-class players, ICC-certified mentors, and ex-internationals — committed
                to making cricket a craft, not a hobby.
              </p>
              <Btn c={C} primary small>View all coaches <ArrowRight className="ml-2 h-3 w-3" /></Btn>
            </div>
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { n: "Vikram Rathore", t: "Head Coach · Batting" },
                { n: "Priya Menon", t: "Bowling Specialist" },
                { n: "Arjun Bhatia", t: "Spin & Fielding" },
              ].map((c, i) => (
                <div key={i} className="overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={COACH_IMG} alt={c.n} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: C.primary }}>{c.t}</div>
                    <div className="font-display text-xl font-bold uppercase tracking-tight mt-1">{c.n}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img src={BALL_IMG} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-24 text-center" style={{ color: C.ink }}>
          <h3 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight">Ready to step on the pitch?</h3>
          <p className="mt-4" style={{ color: C.fgMuted }}>Join hundreds of players sharpening their game with PitchPro.</p>
          <div className="mt-8 inline-flex">
            <Btn c={C} primary>Become a member <ArrowRight className="ml-2 h-4 w-4" /></Btn>
          </div>
        </div>
      </section>

      <Footer c={C} />
    </div>
  );
}

/* ---- shared ---- */
function Header({ c }) {
  return (
    <header className="sticky top-0 z-50 border-b-2" style={{ background: c.bg + "EE", backdropFilter: "blur(12px)", borderColor: c.fg }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center" style={{ background: c.fg, borderRadius: 2 }}>
            <span className="font-display text-2xl font-bold" style={{ color: c.cream }}>P</span>
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl font-bold uppercase tracking-tight">PitchPro</div>
            <div className="text-[9px] tracking-[0.32em] uppercase mt-0.5" style={{ color: c.fgMuted }}>Cricket Academy</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-[12px] tracking-[0.18em] uppercase font-bold" style={{ color: c.fgMuted }}>
          <span>Home</span><span>Academy</span><span>Coaches</span><span>Games</span>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/themes" className="text-[11px] tracking-[0.2em] uppercase font-bold flex items-center gap-1" style={{ color: c.fg }}>
            <ChevronLeft className="h-3 w-3" /> Back
          </Link>
          <Btn c={c} primary small>Join</Btn>
        </div>
      </div>
    </header>
  );
}

function Footer({ c }) {
  return (
    <footer style={{ background: c.surface, borderTop: `1px solid ${c.border}` }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="font-display text-3xl font-bold uppercase tracking-tight">PitchPro</div>
          <p className="mt-3 text-sm" style={{ color: c.fgMuted }}>High-performance cricket coaching.</p>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: c.primary }}>Visit</div>
          <p className="mt-3 text-sm" style={{ color: c.fgMuted }}>12 Stadium Lane<br/>Sportsville</p>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: c.primary }}>Hours</div>
          <p className="mt-3 text-sm" style={{ color: c.fgMuted }}>Mon–Fri 6 am – 10 pm<br/>Sat–Sun 7 am – 9 pm</p>
        </div>
      </div>
      <div className="text-center text-xs py-4 border-t" style={{ color: c.fgMuted, borderColor: c.border }}>
        © 2026 PitchPro Cricket Academy.
      </div>
    </footer>
  );
}

function Btn({ c, children, primary, small }) {
  const cls = small ? "px-4 py-1.5 text-xs" : "px-6 py-3 text-sm";
  return (
    <button className={`inline-flex items-center font-display tracking-[0.2em] uppercase font-bold transition-all duration-150 ${cls}`}
            style={primary
              ? { background: c.primary, color: "#fff", borderRadius: 2 }
              : { background: "transparent", color: c.fg, border: `1px solid ${c.fg}`, borderRadius: 2 }}>
      {children}
    </button>
  );
}

function FeatureBig({ c, className = "", icon, title, desc, img }) {
  return (
    <div className={`relative overflow-hidden ${className}`}
         style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 4 }}>
      {img && (
        <div className="absolute inset-0 opacity-90">
          <img src={img} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${c.ink}DD 100%)` }} />
        </div>
      )}
      <div className="relative p-8 md:p-10 md:min-h-[460px] flex flex-col justify-between" style={{ color: "#fff" }}>
        <div>
          <div className="inline-grid place-items-center h-10 w-10" style={{ background: "#ffffff20", borderRadius: 2 }}>
            {icon}
          </div>
          <h3 className="mt-6 font-display font-bold uppercase tracking-tight text-4xl md:text-5xl">{title}</h3>
          <p className="mt-2 max-w-md opacity-90">{desc}</p>
        </div>
        <div className="font-display tracking-[0.2em] uppercase text-sm font-bold inline-flex items-center gap-2">
          Book Now <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Feature({ c, className = "", icon, title, desc, tone }) {
  const isAccent = tone === "accent";
  return (
    <div className={`p-6 transition-all duration-200 hover:-translate-y-0.5 ${className}`}
         style={{ background: isAccent ? c.cream : c.surface, border: `1px solid ${c.border}`, borderRadius: 4 }}>
      <div className="inline-grid place-items-center h-10 w-10"
           style={{ background: (isAccent ? c.accent : c.primary) + "1A", color: isAccent ? c.accent : c.primary, borderRadius: 2 }}>
        {icon}
      </div>
      <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">{title}</h3>
      <p className="mt-2 text-sm" style={{ color: c.fgMuted }}>{desc}</p>
    </div>
  );
}
