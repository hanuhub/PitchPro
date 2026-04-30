import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMsg } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Clock, MapPin, Trash2, BarChart3, Bell, Users, DollarSign, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState([]);
  const [games, setGames] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [fees, setFees] = useState([]);

  const reload = async () => {
    const [b, s, p, g, n, f] = await Promise.all([
      api.get("/bookings/me"),
      api.get("/sessions/me"),
      api.get("/progress/me"),
      api.get("/games"),
      api.get("/notifications/me"),
      api.get("/fees/me"),
    ]);
    setBookings(b.data); setSessions(s.data); setProgress(p.data);
    setGames(g.data); setNotifs(n.data); setFees(f.data);
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

  const today0 = new Date(new Date().toDateString());
  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" && new Date(b.booking_date) >= today0);
  const upcomingSessions = sessions.filter((s) => s.status === "confirmed" && new Date(s.session_date) >= today0);
  const unread = notifs.filter((n) => !n.read).length;
  const pendingFees = fees.filter((f) => f.status !== "paid");
  const pendingTotal = pendingFees.reduce((a, f) => a + Number(f.amount || 0), 0);

  // Kid-aware games (kid in either team)
  const kidNames = (user?.kids || []).map((k) => k.name);
  const myMatches = games.filter((g) => {
    if (kidNames.length === 0) return true;
    return kidNames.some((k) => g.team_a?.includes(k) || g.team_b?.includes(k));
  });

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-2">— Parent Dashboard</div>
          <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">
            Hello, {user?.name?.split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
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

      {/* KPI strip */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="dashboard-stats">
        <KPI label="Upcoming lanes" value={upcomingBookings.length} icon={<Calendar className="h-4 w-4" />} />
        <KPI label="1-1 sessions" value={upcomingSessions.length} icon={<Users className="h-4 w-4" />} />
        <KPI label="Reports" value={progress.length} icon={<BarChart3 className="h-4 w-4" />} />
        <KPI label="Pending fees" value={`$${pendingTotal.toFixed(0)}`} icon={<DollarSign className="h-4 w-4" />} highlight={pendingTotal > 0} />
        <KPI label="Inbox" value={unread} icon={<Bell className="h-4 w-4" />} highlight={unread > 0} />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid lg:grid-cols-3 gap-3">
        <ProgressChart progress={progress} />
        <FeesChart fees={fees} />
        <ActivityChart bookings={bookings} sessions={sessions} />
      </div>

      <Tabs defaultValue="schedule" className="mt-10">
        <TabsList className="bg-card border border-border rounded-sm flex-wrap h-auto" data-testid="dashboard-tabs">
          <TabsTrigger value="schedule" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-progress">Progress</TabsTrigger>
          <TabsTrigger value="matches" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-matches">Matches</TabsTrigger>
          <TabsTrigger value="fees" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="tab-fees">Fees</TabsTrigger>
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
                {b.status === "confirmed" && new Date(b.booking_date) >= today0 && (
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
                {s.status === "confirmed" && new Date(s.session_date) >= today0 && (
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

        <TabsContent value="matches" className="mt-6 grid md:grid-cols-2 gap-3" data-testid="matches-list">
          {myMatches.length === 0 && <Empty text="No matches scheduled." />}
          {myMatches.map((g) => (
            <div key={g.id} className="border border-border bg-card p-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold">
                {new Date(g.game_date).toLocaleDateString(undefined, { weekday: "long" })}
              </div>
              <h3 className="font-display text-2xl font-bold uppercase mt-1">{g.title}</h3>
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {g.game_date} · {g.start_time}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {g.ground_name}</div>
              </div>
              {kidNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {kidNames.filter((k) => g.team_a?.includes(k) || g.team_b?.includes(k)).map((k) => (
                    <span key={k} className="text-[10px] tracking-[0.2em] uppercase font-bold bg-primary/15 text-primary px-2 py-1 border border-primary/30">
                      {k} playing
                    </span>
                  ))}
                </div>
              )}
              <a href={mapLink(g)} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary hover:text-foreground">
                Open Maps →
              </a>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="fees" className="mt-6 space-y-2" data-testid="fees-list">
          {fees.length === 0 && <Empty text="No invoices yet." />}
          {fees.map((f) => (
            <div key={f.id} className="flex items-center justify-between border border-border bg-card px-4 py-3">
              <div>
                <div className="font-display text-base font-bold uppercase">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.kid_name ? f.kid_name + " · " : ""}Due {f.due_date}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-display text-2xl font-bold">${Number(f.amount).toFixed(0)}</div>
                <span className={`text-[10px] tracking-[0.2em] uppercase font-bold px-2 py-1 border ${
                  f.status === "paid" ? "border-secondary text-secondary"
                  : f.status === "overdue" ? "border-destructive text-destructive"
                  : "border-primary text-primary"
                }`}>{f.status}</span>
              </div>
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
      <div className="mt-2 font-display text-4xl font-bold">{value}</div>
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

/* ---------- Charts ---------- */
function ProgressChart({ progress }) {
  // Use latest kid's reports (oldest → newest)
  const grouped = groupBy(progress, "kid_name");
  const kids = Object.keys(grouped);
  const data = (kids[0] ? grouped[kids[0]].slice().reverse() : []).map((p) => ({
    label: p.period_label,
    Batting: p.batting_score, Bowling: p.bowling_score, Fielding: p.fielding_score, Fitness: p.fitness_score,
  }));
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Player progress</div>
          <div className="font-display text-2xl font-bold uppercase">{kids[0] || "No reports"}</div>
        </div>
        <TrendingUp className="h-4 w-4 text-secondary" />
      </div>
      <div className="h-44 mt-3">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Line type="monotone" dataKey="Batting" stroke="hsl(var(--chart-1))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Bowling" stroke="hsl(var(--chart-2))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Fielding" stroke="hsl(var(--chart-3))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Fitness" stroke="hsl(var(--chart-4))" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full grid place-items-center text-xs text-muted-foreground">No data yet</div>
        )}
      </div>
    </div>
  );
}

function FeesChart({ fees }) {
  const paid = fees.filter((f) => f.status === "paid").reduce((a, f) => a + Number(f.amount || 0), 0);
  const pending = fees.filter((f) => f.status !== "paid").reduce((a, f) => a + Number(f.amount || 0), 0);
  const data = [
    { name: "Paid", value: paid, fill: "hsl(var(--chart-2))" },
    { name: "Pending", value: pending, fill: "hsl(var(--chart-1))" },
  ];
  const empty = paid + pending === 0;
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Fees</div>
          <div className="font-display text-2xl font-bold uppercase">${(paid + pending).toFixed(0)} total</div>
        </div>
        <DollarSign className="h-4 w-4 text-secondary" />
      </div>
      <div className="h-44 mt-3">
        {!empty ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={36} outerRadius={64} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full grid place-items-center text-xs text-muted-foreground">No invoices yet</div>
        )}
      </div>
    </div>
  );
}

function ActivityChart({ bookings, sessions }) {
  // Last 8 weeks: count per week
  const weeks = [];
  const today = new Date(new Date().toDateString());
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    weeks.push({ key: weekKey(d), label: `W${weekNum(d)}`, lanes: 0, sessions: 0 });
  }
  const idx = new Map(weeks.map((w, i) => [w.key, i]));
  bookings.forEach((b) => {
    if (b.status === "cancelled") return;
    const k = weekKey(new Date(b.booking_date));
    if (idx.has(k)) weeks[idx.get(k)].lanes += 1;
  });
  sessions.forEach((s) => {
    if (s.status === "cancelled") return;
    const k = weekKey(new Date(s.session_date));
    if (idx.has(k)) weeks[idx.get(k)].sessions += 1;
  });
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Activity (8 wk)</div>
          <div className="font-display text-2xl font-bold uppercase">Training mix</div>
        </div>
        <BarChart3 className="h-4 w-4 text-secondary" />
      </div>
      <div className="h-44 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            <Bar dataKey="lanes" stackId="a" fill="hsl(var(--chart-1))" />
            <Bar dataKey="sessions" stackId="a" fill="hsl(var(--chart-2))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KidProgress({ kid, items }) {
  const data = items.slice().reverse().map((p) => ({
    label: p.period_label,
    Batting: p.batting_score, Bowling: p.bowling_score, Fielding: p.fielding_score, Fitness: p.fitness_score,
  }));
  const latest = items[0];
  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary">— Player</div>
          <h3 className="font-display text-3xl font-bold uppercase">{kid}</h3>
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

function weekKey(d) {
  const dt = new Date(d);
  const day = dt.getDay() || 7;
  dt.setDate(dt.getDate() - day + 1); // monday
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}

function weekNum(d) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = (target - firstThursday) / 86400000;
  return 1 + Math.ceil(diff / 7);
}
