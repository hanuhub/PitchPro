import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, BarChart3, Trophy, MapPin, ChevronLeft, Sparkles } from "lucide-react";

/* ----- Sky & Apricot palette (fresh + cheerful) ----- */
const C = {
  bg: "#EEF3F7",
  surface: "#FFFFFF",
  surface2: "#FFE9DD",
  fg: "#1B2A36",
  fgMuted: "#586B7B",
  primary: "#E89175",        // apricot coral
  primaryDark: "#D26F4F",
  accent: "#7CC0A8",         // mint
  accent2: "#F4D17C",        // soft butter yellow
  border: "#D8E1EA",
  blue: "#7BA9D6",
};

const HERO_BG = "https://images.pexels.com/photos/30671893/pexels-photo-30671893.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function ThemeSky() {
  return (
    <div style={{ background: C.bg, color: C.fg }} data-testid="theme-sky" className="min-h-screen">
      <Header c={C} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full opacity-50" style={{ background: C.primary }} />
        <div className="absolute top-32 -left-20 h-72 w-72 rounded-full opacity-30" style={{ background: C.accent }} />
        <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full opacity-30" style={{ background: C.accent2 }} />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 pt-20 pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
                 style={{ background: C.surface, color: C.fg, border: `1px solid ${C.border}` }}>
              <Sparkles className="h-3 w-3" style={{ color: C.primary }} /> New season, new pitch.
            </div>
            <h1 className="mt-6 font-display text-6xl sm:text-7xl lg:text-[7rem] font-bold uppercase leading-[0.9] tracking-tighter">
              Train like<br/>
              <span style={{ color: C.primary }}>a champion</span>.<br/>
              Play like one.
            </h1>
            <p className="mt-8 max-w-xl text-base md:text-lg leading-relaxed" style={{ color: C.fgMuted }}>
              Book practice lanes, schedule 1-on-1 sessions with elite coaches, track player progress
              and join weekend matches — all in one place.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Pill c={C} primary>Book a Lane <ArrowRight className="ml-2 h-4 w-4" /></Pill>
              <Pill c={C}>Meet the Coaches</Pill>
            </div>
          </div>

          {/* Floating preview card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${C.border}` }}>
              <img src={HERO_BG} alt="Cricket action" className="w-full aspect-[4/5] object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, transparent 40%, ${C.primary}40 100%)` }} />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl flex items-center gap-3"
                   style={{ background: "#FFFFFFCC", backdropFilter: "blur(12px)" }}>
                <div className="grid h-10 w-10 place-items-center rounded-full" style={{ background: C.accent }}>
                  <Trophy className="h-5 w-5" style={{ color: "#fff" }} />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: C.primary }}>Latest Win</div>
                  <div className="font-bold text-sm" style={{ color: C.fg }}>U-14 League Champions 2024</div>
                </div>
              </div>
            </div>

            {/* floating stat bubbles */}
            <div className="absolute -top-5 -left-5 px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3"
                 style={{ background: C.surface }}>
              <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: C.primary + "20" }}>
                <Users className="h-4 w-4" style={{ color: C.primary }} />
              </div>
              <div>
                <div className="font-display text-lg font-bold leading-none">320+</div>
                <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: C.fgMuted }}>Players</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-3 px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3"
                 style={{ background: C.surface }}>
              <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: C.accent + "30" }}>
                <Calendar className="h-4 w-4" style={{ color: C.accent }} />
              </div>
              <div>
                <div className="font-display text-lg font-bold leading-none">05</div>
                <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: C.fgMuted }}>Lanes today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y" style={{ background: C.surface2, borderColor: C.border }}>
        <div className="flex gap-12 py-5 whitespace-nowrap font-display font-bold uppercase text-2xl tracking-tight animate-marquee">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12" style={{ color: C.fg }}>
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

      {/* FEATURES — rounded soft cards */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="text-center mb-14">
          <div className="text-[11px] tracking-[0.3em] uppercase font-bold mb-2" style={{ color: C.primary }}>— What we offer</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight max-w-3xl mx-auto">
            Everything you need to grow as a cricketer.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Feature c={C} tone={C.primary} icon={<Calendar />} title="Lane Booking"
                   desc="Pick your lane, pick your time. Modify or cancel up to 24 hours before." />
          <Feature c={C} tone={C.accent} icon={<Users />} title="1-on-1 Coaching"
                   desc="Book elite coaches by sport-specialty and availability." />
          <Feature c={C} tone={C.accent2} icon={<BarChart3 />} title="Progress Reports"
                   desc="Weekly & monthly performance reports — straight to your inbox." />
          <Feature c={C} tone={C.blue} icon={<Trophy />} title="Weekend Games"
                   desc="Sat–Sun fixtures with team rosters & ground GPS." />
          <Feature c={C} tone={C.primary} icon={<MapPin />} title="Ground Locations"
                   desc="GPS pinned grounds with one-tap directions." />
          <Feature c={C} tone={C.accent} icon={<Trophy />} title="Award-winning"
                   desc="Best Junior Academy 2024 & Excellence in Coaching 2023." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pb-24">
        <div className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden"
             style={{ background: `linear-gradient(135deg, ${C.primary}E0 0%, ${C.accent}D0 100%)`, color: "#fff" }}>
          <h3 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight">Ready to step on the pitch?</h3>
          <p className="mt-4 opacity-90">Join hundreds of players sharpening their game with PitchPro.</p>
          <div className="mt-8 inline-flex">
            <button className="px-7 py-3.5 rounded-full font-display tracking-[0.2em] uppercase font-bold text-sm"
                    style={{ background: "#fff", color: C.primaryDark }}>
              Become a member <ArrowRight className="ml-2 h-4 w-4 inline" />
            </button>
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
    <header className="sticky top-0 z-50" style={{ background: c.bg + "EE", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}` }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: c.primary }}>
            <span className="font-display text-2xl font-bold" style={{ color: "#fff" }}>P</span>
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
          <Pill c={c} primary small>Join</Pill>
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

function Pill({ c, children, primary, small }) {
  const cls = small ? "px-4 py-1.5 text-xs" : "px-6 py-3 text-sm";
  return (
    <button className={`inline-flex items-center font-display tracking-[0.2em] uppercase font-bold rounded-full transition-all duration-150 ${cls}`}
            style={primary
              ? { background: c.primary, color: "#fff", boxShadow: `0 8px 20px -8px ${c.primary}90` }
              : { background: c.surface, color: c.fg, border: `1px solid ${c.border}` }}>
      {children}
    </button>
  );
}

function Feature({ c, tone, icon, title, desc }) {
  return (
    <div className="rounded-3xl p-7 transition-all duration-200 hover:-translate-y-1"
         style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="grid h-12 w-12 place-items-center rounded-2xl"
           style={{ background: tone + "25", color: tone }}>
        {icon}
      </div>
      <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">{title}</h3>
      <p className="mt-2 text-sm" style={{ color: c.fgMuted }}>{desc}</p>
    </div>
  );
}
