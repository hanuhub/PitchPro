import { Link } from "react-router-dom";

const THEMES = [
  {
    id: "sage",
    name: "Linen & Sage",
    tagline: "Editorial · Premium · Calm",
    bg: "#FAF6F0",
    fg: "#1F2622",
    primary: "#5C7A5A",
    accent: "#C45D3F",
    description: "Cream linen background, sage-green pitch tones and a terracotta accent. Generous whitespace, editorial feel.",
  },
  {
    id: "sky",
    name: "Sky & Apricot",
    tagline: "Fresh · Cheerful · Modern",
    bg: "#EEF3F7",
    fg: "#1B2A36",
    primary: "#E89175",
    accent: "#7CC0A8",
    description: "Powder-blue sky, apricot coral and mint touches. Rounded corners and gradient washes — modern wellness vibe.",
  },
  {
    id: "pitch",
    name: "Cream & Pitch",
    tagline: "Sporty · Warm · Refined",
    bg: "#F4EFE6",
    fg: "#2C3624",
    primary: "#7A9B6E",
    accent: "#C2826E",
    description: "Warm cream paper, forest-pastel green and dusty red accents. Sporty cards, tight grids, premium-print look.",
  },
];

export default function ThemePicker() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Pick a vibe</div>
      <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">Three pastel themes</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Tap any card to preview the full landing page. Once you pick one, I'll apply it across the whole app.
      </p>

      <div className="mt-12 grid md:grid-cols-3 gap-5" data-testid="theme-cards">
        {THEMES.map((t) => (
          <Link
            key={t.id}
            to={`/themes/${t.id}`}
            data-testid={`theme-card-${t.id}`}
            className="group border border-border bg-card overflow-hidden hover:-translate-y-1 transition-all duration-200"
          >
            {/* Visual preview */}
            <div className="aspect-[5/4] relative" style={{ background: t.bg, color: t.fg }}>
              {/* Hero tile */}
              <div className="p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: t.primary }}>
                    PitchPro · {t.tagline}
                  </div>
                  <div className="mt-3 font-display font-bold uppercase leading-none text-3xl" style={{ color: t.fg }}>
                    Train like
                    <br />
                    <span style={{ color: t.primary }}>a champion.</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide" style={{ background: t.primary, color: "#fff" }}>
                    Book a Lane
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border" style={{ borderColor: t.fg + "30", color: t.fg }}>
                    Join
                  </span>
                </div>
              </div>
              {/* swatches */}
              <div className="absolute right-3 top-3 flex gap-1">
                <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: t.primary }} />
                <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: t.accent }} />
                <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: t.fg }} />
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="font-display text-2xl font-bold uppercase tracking-tight">{t.name}</div>
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Option {THEMES.indexOf(t) + 1}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold tracking-[0.2em] uppercase text-primary group-hover:translate-x-0.5 transition-transform">
                Preview full page →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
