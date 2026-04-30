import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, BarChart3, Trophy, MapPin, ChevronLeft } from "lucide-react";

/* ----- Linen & Sage palette ----- */
const C = {
  bg: "#FAF6F0",
  surface: "#FFFFFF",
  surface2: "#F2EBE0",
  fg: "#1F2622",
  fgMuted: "#5E6A5C",
  primary: "#5C7A5A",       // sage
  primaryDark: "#43603F",
  accent: "#C45D3F",        // terracotta
  border: "#E5DCCB",
  rule: "#D9CFB9",
};

const HERO_BG = "https://images.pexels.com/photos/30671893/pexels-photo-30671893.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const COACH_IMG = "https://images.unsplash.com/photo-1593766788306-28561086694e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85";
const BALL_IMG = "https://images.pexels.com/photos/30401509/pexels-photo-30401509.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function ThemeSage() {
  return (
    <div style={{ background: C.bg, color: C.fg }} data-testid="theme-sage" className="min-h-screen">
      <Header c={C} />

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 md:px-8 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="text-[11px] tracking-[0.4em] uppercase font-bold mb-6" style={{ color: C.primary }}>
              ◆ PitchPro — Est. 2014
            </div>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-[7rem] font-bold uppercase leading-[0.9] tracking-tighter">
              Train like<br/>
              <span style={{ color: C.primary }}>a champion</span>.<br/>
              Play like one.
            </h1>
            <p className="mt-8 max-w-xl text-base md:text-lg leading-relaxed" style={{ color: C.fgMuted }}>
              Book practice lanes, schedule 1-on-1 sessions with elite coaches, track player progress
              and join weekend matches — all in one place.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <PillButton c={C} primary>Book a Lane <ArrowRight className="ml-2 h-4 w-4" /></PillButton>
              <PillButton c={C}>Meet the Coaches</PillButton>
            </div>
            <div className="mt-12 grid grid-cols-4 gap-6 max-w-md">
              {[["320+", "Players"], ["08", "Coaches"], ["05", "Lanes"], ["14", "Trophies"]].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl font-bold" style={{ color: C.fg }}>{v}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: C.fgMuted }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative overflow-hidden" style={{ borderRadius: 6, border: `1px solid ${C.border}` }}>
              <img src={HERO_BG} alt="Cricket action" className="w-full aspect-[4/5] object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 50%, ${C.primary}30 100%)` }} />
            </div>
            <div className="absolute -bottom-6 -left-6 w-44 p-4 rounded-md shadow-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: C.primary }}>Next session</div>
              <div className="font-display text-xl font-bold mt-1">Sat 9:00</div>
              <div className="text-xs" style={{ color: C.fgMuted }}>Coach Vikram · Lane 3</div>
            </div>
          </div>
        </div>
      </section>

      {/* RULE LINE */}
      <div style={{ background: C.surface2 }} className="overflow-hidden border-y" >
        <div className="flex gap-12 py-5 whitespace-nowrap font-display font-bold uppercase text-2xl tracking-tight animate-marquee">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12" style={{ color: C.fgMuted }}>
              Train Like A Pro
              <span style={{ color: C.accent }}>●</span>
              High Performance
              <span style={{ color: C.accent }}>●</span>
              Elite Coaching
              <span style={{ color: C.accent }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES BENTO */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase font-bold mb-2" style={{ color: C.primary }}>— What we offer</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">
              Everything you need.<br/>Nothing you don't.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <BigCard c={C} className="md:col-span-3 md:row-span-2"
                   icon={<Calendar className="h-6 w-6" />}
                   title="Lane Booking"
                   description="Pick your lane, pick your time. Modify or cancel up to 24 hours before."
                   bg={HERO_BG} />
          <Tile c={C} className="md:col-span-3" icon={<Users className="h-6 w-6" />}
                title="1-on-1 Coaching" description="Book elite coaches by sport-specialty and availability." />
          <Tile c={C} className="md:col-span-3" icon={<BarChart3 className="h-6 w-6" />}
                title="Kids Progress" description="Weekly & monthly performance reports — straight to your inbox." />
          <Tile c={C} className="md:col-span-2" icon={<Trophy className="h-6 w-6" />}
                title="Weekend Games" description="Sat–Sun fixtures with team rosters & ground GPS." />
          <Tile c={C} className="md:col-span-2" icon={<MapPin className="h-6 w-6" />}
                title="Ground Locations" description="GPS pinned grounds with one-tap directions." />
          <Tile c={C} className="md:col-span-2" tone="accent" icon={<Trophy className="h-6 w-6" />}
                title="Award-winning" description="Best Junior Academy 2024 & Excellence in Coaching 2023." />
        </div>
      </section>

      {/* COACHES */}
      <section style={{ background: C.surface2 }} className="border-y" >
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <div className="text-[11px] tracking-[0.3em] uppercase font-bold mb-2" style={{ color: C.primary }}>— Our team</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight">Coached by champions.</h2>
            <p className="mt-5" style={{ color: C.fgMuted }}>
              Former first-class players, ICC-certified mentors, and ex-internationals — committed to
              making cricket a craft, not a hobby.
            </p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-3">
            {[
              { n: "Vikram Rathore", t: "Head Coach · Batting" },
              { n: "Priya Menon", t: "Bowling Specialist" },
              { n: "Arjun Bhatia", t: "Spin & Fielding" },
              { n: "Sara Iqbal", t: "Strength & Conditioning" },
            ].map((c, i) => (
              <div key={i} className="p-5" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                <img src={COACH_IMG} alt="" className="h-16 w-16 object-cover rounded-full mb-3" />
                <div className="font-display text-xl font-bold uppercase">{c.n}</div>
                <div className="text-xs tracking-[0.2em] uppercase mt-1" style={{ color: C.primary }}>{c.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24 text-center">
        <h3 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight">Ready to step on the pitch?</h3>
        <p className="mt-4" style={{ color: C.fgMuted }}>Join hundreds of players sharpening their game with PitchPro.</p>
        <div className="mt-8 inline-flex">
          <PillButton c={C} primary>Become a member <ArrowRight className="ml-2 h-4 w-4" /></PillButton>
        </div>
      </section>

      <Footer c={C} />
    </div>
  );
}

/* ---- shared bits ---- */
function Header({ c }) {
  return (
    <header className="sticky top-0 z-50" style={{ background: c.bg + "EE", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}` }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-md" style={{ background: c.primary }}>
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
        <div className="flex items-center gap-2">
          <Link to="/themes" className="text-[11px] tracking-[0.2em] uppercase font-bold flex items-center gap-1" style={{ color: c.fg }} data-testid="back-to-themes">
            <ChevronLeft className="h-3 w-3" /> Back
          </Link>
          <PillButton c={c} primary small>Join</PillButton>
        </div>
      </div>
    </header>
  );
}

function Footer({ c }) {
  return (
    <footer style={{ background: c.surface, borderTop: `1px solid ${c.border}` }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-1">
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

function PillButton({ c, children, primary, small }) {
  const cls = small ? "px-4 py-1.5 text-xs" : "px-6 py-3 text-sm";
  return (
    <button className={`inline-flex items-center font-display tracking-[0.2em] uppercase font-bold rounded-md transition-all duration-150 ${cls}`}
            style={primary
              ? { background: c.primary, color: "#fff" }
              : { background: "transparent", color: c.fg, border: `1px solid ${c.fg}40` }}>
      {children}
    </button>
  );
}

function BigCard({ c, className = "", icon, title, description, bg }) {
  return (
    <div className={`group relative overflow-hidden ${className}`}
         style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 6 }}>
      {bg && (
        <div className="absolute inset-0 opacity-90">
          <img src={bg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${c.surface}10 0%, ${c.fg}80 100%)` }} />
        </div>
      )}
      <div className="relative p-8 md:p-10 md:min-h-[420px] flex flex-col justify-between" style={{ color: bg ? "#fff" : c.fg }}>
        <div>
          <div className="inline-grid place-items-center h-10 w-10 rounded-md"
               style={{ background: bg ? "#ffffff20" : c.primary + "20", color: bg ? "#fff" : c.primary }}>
            {icon}
          </div>
          <h3 className="mt-5 font-display font-bold uppercase tracking-tight text-4xl md:text-5xl">{title}</h3>
          <p className="mt-2 max-w-md" style={{ color: bg ? "#ffffffcc" : c.fgMuted }}>{description}</p>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 font-display tracking-[0.2em] uppercase text-sm font-bold"
             style={{ color: bg ? "#fff" : c.primary }}>
          Book Now <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Tile({ c, className = "", icon, title, description, tone }) {
  const isAccent = tone === "accent";
  return (
    <div className={`group p-6 transition-all duration-200 hover:-translate-y-1 ${className}`}
         style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 6 }}>
      <div className="inline-grid place-items-center h-10 w-10 rounded-md"
           style={{ background: (isAccent ? c.accent : c.primary) + "18", color: isAccent ? c.accent : c.primary }}>
        {icon}
      </div>
      <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight">{title}</h3>
      <p className="mt-1 text-sm" style={{ color: c.fgMuted }}>{description}</p>
    </div>
  );
}
