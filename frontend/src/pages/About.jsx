import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy } from "lucide-react";

const COACH_IMG = "https://images.unsplash.com/photo-1593766788306-28561086694e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85";

export default function About() {
  const [awards, setAwards] = useState([]);
  useEffect(() => { api.get("/awards").then((r) => setAwards(r.data)); }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 opacity-30">
          <img src={COACH_IMG} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-24">
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— About Crease</div>
          <h1 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tight max-w-3xl">
            Where talent meets technique.
          </h1>
          <p className="mt-6 max-w-2xl text-muted-foreground">
            Founded in 2014 by former first-class players, PitchPro is a high-performance cricket
            training centre dedicated to nurturing players from age 7 to professionals. We blend modern
            coaching science with traditional cricketing wisdom.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-20 grid md:grid-cols-3 gap-3" data-testid="values-section">
        {[
          { t: "Performance First", d: "Data-driven coaching with video analysis and progress tracking." },
          { t: "Pathways", d: "From beginners to state-level — structured programs for every level." },
          { t: "Community", d: "Weekend matches, league play, and a tight-knit player network." },
        ].map((v) => (
          <div key={v.t} className="border border-border bg-card p-8 hover:border-primary transition-colors">
            <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Core value</div>
            <h3 className="font-display text-3xl font-bold uppercase">{v.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </section>

      {/* Awards */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Recognition</div>
            <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight">Awards & honours</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3" data-testid="awards-list">
          {awards.map((a) => (
            <div key={a.id} className="flex gap-5 border border-border bg-card p-6 hover:border-secondary transition-colors">
              <div className="h-12 w-12 grid place-items-center bg-secondary/15 text-secondary shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold uppercase tracking-tight">{a.title}</div>
                <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-1">
                  {a.issuer} · {a.year}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
