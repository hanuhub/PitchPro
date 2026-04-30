import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMsg } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Trash2, BarChart3, Bell, Users } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [games, setGames] = useState([]);
  const [notifs, setNotifs] = useState([]);

  const reload = async () => {
    const [b, s, p, g, n] = await Promise.all([
      api.get("/bookings/me"),
      api.get("/sessions/me"),
      api.get("/progress/me"),
      api.get("/games"),
      api.get("/notifications/me"),
    ]);
    setBookings(b.data); setSessions(s.data); setProgress(p.data); setGames(g.data); setNotifs(n.data);
  };

  useEffect(() => { reload(); }, []);

  const cancelBooking = async (id) => {
    try { await api.delete(`/bookings/${id}`); toast.success("Booking cancelled"); reload(); }
    catch (e) { toast.error(errorMsg(e)); }
  };
  const cancelSession = async (id) => {
    try { await api.delete(`/sessions/${id}`); toast.success("Session cancelled"); reload(); }
    catch (e) { toast.error(errorMsg(e)); }
  };

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" && new Date(b.booking_date) >= new Date(new Date().toDateString()));
  const upcomingSessions = sessions.filter((s) => s.status === "confirmed" && new Date(s.session_date) >= new Date(new Date().toDateString()));
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-2">— Player Console</div>
          <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight">
            Hello, {user?.name?.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="rounded-sm font-display tracking-[0.2em] uppercase" data-testid="dashboard-book-lane">
            <Link to="/book">Book Lane</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-sm font-display tracking-[0.2em] uppercase border-foreground/30" data-testid="dashboard-book-coach">
            <Link to="/coaching">Book Coach</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="dashboard-stats">
        <KPI label="Upcoming lanes" value={upcomingBookings.length} icon={<Calendar className="h-4 w-4" />} />
        <KPI label="1-1 sessions" value={upcomingSessions.length} icon={<Users className="h-4 w-4" />} />
        <KPI label="Reports" value={progress.length} icon={<BarChart3 className="h-4 w-4" />} />
        <KPI label="Notifications" value={unread} icon={<Bell className="h-4 w-4" />} highlight={unread > 0} />
      </div>

      <Tabs defaultValue="schedule" className="mt-10">
        <TabsList className="bg-card border border-border rounded-sm" data-testid="dashboard-tabs">
          <TabsTrigger value="schedule" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-progress">Progress</TabsTrigger>
          <TabsTrigger value="games" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-games">Games</TabsTrigger>
          <TabsTrigger value="notif" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-notif">Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6 grid lg:grid-cols-2 gap-3">
          <Section title="Lane Bookings">
            {bookings.length === 0 && <Empty text="No bookings yet." />}
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-border bg-card px-4 py-3" data-testid={`booking-row-${b.id}`}>
                <div>
                  <div className="font-display text-lg font-bold uppercase">{b.lane_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.booking_date} · {b.start_hour}:00 – {b.start_hour + b.duration_hours}:00 · ${b.total_price}
                  </div>
                  {b.status === "cancelled" && <div className="text-xs text-destructive mt-1">Cancelled</div>}
                </div>
                {b.status === "confirmed" && (
                  <Button size="sm" variant="ghost" onClick={() => cancelBooking(b.id)} data-testid={`cancel-booking-${b.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </Section>
          <Section title="1-1 Sessions">
            {sessions.length === 0 && <Empty text="No coaching sessions yet." />}
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-border bg-card px-4 py-3" data-testid={`session-row-${s.id}`}>
                <div>
                  <div className="font-display text-lg font-bold uppercase">{s.coach_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.session_date} · {s.start_hour}:00 · {s.focus || "General"} · ${s.total_price}
                  </div>
                  {s.status === "cancelled" && <div className="text-xs text-destructive mt-1">Cancelled</div>}
                </div>
                {s.status === "confirmed" && (
                  <Button size="sm" variant="ghost" onClick={() => cancelSession(s.id)} data-testid={`cancel-session-${s.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </Section>
        </TabsContent>

        <TabsContent value="progress" className="mt-6 space-y-3" data-testid="progress-list">
          {progress.length === 0 && (
            <div className="border border-border bg-card p-10 text-center text-muted-foreground">
              No progress reports yet. Your coach will publish weekly & monthly reports here.
            </div>
          )}
          {Object.entries(groupBy(progress, "kid_name")).map(([kid, items]) => (
            <KidProgress key={kid} kid={kid} items={items} />
          ))}
        </TabsContent>

        <TabsContent value="games" className="mt-6 grid md:grid-cols-2 gap-3">
          {games.length === 0 && <Empty text="No upcoming games." />}
          {games.map((g) => (
            <div key={g.id} className="border border-border bg-card p-5" data-testid={`game-card-${g.id}`}>
              <div className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold">
                {new Date(g.game_date).toLocaleDateString(undefined, { weekday: "long" })}
              </div>
              <h3 className="font-display text-2xl font-black uppercase mt-1">{g.title}</h3>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {g.game_date} · {g.start_time}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {g.ground_name}</div>
              </div>
              <a href={mapLink(g)} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary hover:text-foreground">
                Open Maps →
              </a>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="notif" className="mt-6 space-y-2" data-testid="notif-list">
          {notifs.length === 0 && <Empty text="Inbox is empty." />}
          {notifs.map((n) => (
            <div key={n.id} className={`flex items-start gap-4 border border-border bg-card p-4 ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
              <div className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold w-20 shrink-0">{n.channel}</div>
              <div className="flex-1">
                <div className="font-bold">{n.subject}</div>
                <div className="text-sm text-muted-foreground">{n.message}</div>
                <div className="mt-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value, icon, highlight }) {
  return (
    <div className={`border bg-card p-5 ${highlight ? "border-primary" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-[10px] tracking-[0.3em] uppercase">{label}</span></div>
      <div className="mt-2 font-display text-4xl font-black">{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— {title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="border border-border bg-card p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] ||= []).push(item);
    return acc;
  }, {});
}

function KidProgress({ kid, items }) {
  const data = items.slice().reverse().map((p, i) => ({
    label: p.period_label,
    Batting: p.batting_score, Bowling: p.bowling_score, Fielding: p.fielding_score, Fitness: p.fitness_score,
  }));
  const latest = items[0];
  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary">— Player</div>
          <h3 className="font-display text-3xl font-black uppercase">{kid}</h3>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          Latest: {latest.period_label}
          <div className="text-xs">{latest.period_type}</div>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="Batting" stroke="hsl(var(--chart-1))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Bowling" stroke="hsl(var(--chart-2))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Fielding" stroke="hsl(var(--chart-3))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Fitness" stroke="hsl(var(--chart-4))" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-secondary mb-1">Strengths</div>
            <ul className="text-muted-foreground list-disc pl-5 space-y-0.5">{latest.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary mb-1">Improve</div>
            <ul className="text-muted-foreground list-disc pl-5 space-y-0.5">{latest.areas_to_improve.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </div>
        <p className="mt-3 text-sm italic text-muted-foreground">"{latest.summary}"</p>
      </div>
    </div>
  );
}

function mapLink(g) {
  if (g.gps_lat && g.gps_lng) return `https://www.google.com/maps/search/?api=1&query=${g.gps_lat},${g.gps_lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.ground_address)}`;
}
