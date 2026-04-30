import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const GROUND_IMG = "https://images.unsplash.com/photo-1675693303492-9a5bc898bf94?crop=entropy&cs=srgb&fm=jpg&w=800&q=85";

export default function Games() {
  const [games, setGames] = useState([]);
  useEffect(() => { api.get("/games").then((r) => setGames(r.data)); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-16">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Weekend Fixtures</div>
      <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight">Game on.</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Saturday & Sunday matches — view team rosters, ground locations and timings. Coaches send
        confirmations via email and WhatsApp.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-4" data-testid="games-list">
        {games.length === 0 && (
          <div className="col-span-full border border-border bg-card p-10 text-center text-muted-foreground">
            No games scheduled yet. Check back soon.
          </div>
        )}
        {games.map((g) => (
          <article key={g.id} className="border border-border bg-card overflow-hidden hover:border-primary transition-colors">
            <div className="aspect-[16/7] overflow-hidden relative">
              <img src={GROUND_IMG} alt="" className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">
                  {new Date(g.game_date).toLocaleDateString(undefined, { weekday: "long" })}
                </div>
                <h3 className="mt-1 font-display text-3xl font-black uppercase tracking-tight">{g.title}</h3>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <Info icon={<Calendar className="h-4 w-4" />} label="Date" value={g.game_date} />
              <Info icon={<Clock className="h-4 w-4" />} label="Time" value={g.start_time} />
              <Info icon={<MapPin className="h-4 w-4" />} label="Ground" value={g.ground_name} />
              <Info icon={<Users className="h-4 w-4" />} label="Teams" value={`${g.team_a.length} vs ${g.team_b.length}`} />
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border border-border p-3">
                  <div className="font-display tracking-[0.2em] uppercase font-bold text-primary mb-2">Team A</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {g.team_a.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
                <div className="border border-border p-3">
                  <div className="font-display tracking-[0.2em] uppercase font-bold text-secondary mb-2">Team B</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {g.team_b.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
              </div>
              {g.notes && (
                <p className="mt-4 text-xs text-muted-foreground italic">{g.notes}</p>
              )}
              <div className="mt-4 text-xs">
                <a
                  href={mapLink(g)}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase hover:text-foreground transition-colors"
                  data-testid={`game-map-${g.id}`}
                >
                  Open in Maps →
                </a>
                <span className="ml-3 text-muted-foreground">{g.ground_address}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function mapLink(g) {
  if (g.gps_lat && g.gps_lng) return `https://www.google.com/maps/search/?api=1&query=${g.gps_lat},${g.gps_lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.ground_address)}`;
}

function Info({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 grid place-items-center bg-muted text-muted-foreground shrink-0 rounded-sm">{icon}</div>
      <div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
