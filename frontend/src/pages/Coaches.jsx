import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export default function Coaches() {
  const [coaches, setCoaches] = useState([]);
  useEffect(() => { api.get("/coaches").then((r) => setCoaches(r.data)); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-16">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Our team</div>
      <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight">Meet the coaches</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Learn from the best. Our coaches are former state, national and first-class players with proven
        track records of developing elite young cricketers.
      </p>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="coaches-grid">
        {coaches.map((c) => (
          <article key={c.id} className="group border border-border bg-card overflow-hidden hover:-translate-y-1 hover:border-primary transition-all duration-200">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={c.photo_url || "https://images.unsplash.com/photo-1593766788306-28561086694e?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"}
                   alt={c.name}
                   className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <div className="text-xs tracking-[0.2em] uppercase text-primary font-bold">{c.title}</div>
              <h3 className="mt-2 font-display text-3xl font-black uppercase tracking-tight">{c.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.bio}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.specialties?.map((s) => (
                  <span key={s} className="text-[10px] tracking-[0.2em] uppercase font-bold bg-muted text-muted-foreground px-2 py-1 border border-border">
                    {s}
                  </span>
                ))}
              </div>
              {c.awards?.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {c.awards.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Trophy className="h-3 w-3 text-secondary" /> {a}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5">
                <Button asChild className="w-full rounded-sm font-display tracking-[0.2em] uppercase" data-testid={`coach-book-${c.id}`}>
                  <Link to="/coaching" state={{ coachId: c.id }}>Book 1-1 Session</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
