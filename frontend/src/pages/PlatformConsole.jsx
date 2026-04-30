import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Building2, Users, GraduationCap, MapPin, TrendingUp, AlertTriangle,
  Activity, Wallet, Trophy, Sparkles,
} from "lucide-react";

export default function PlatformConsole() {
  const [stats, setStats] = useState({});
  const [academies, setAcademies] = useState([]);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/platform/stats").then((r) => setStats(r.data)),
      api.get("/platform/academies").then((r) => setAcademies(r.data)),
      api.get("/platform/timeseries").then((r) => setSeries(r.data)),
    ]).catch(() => {});
  }, []);

  const totalRevChart = academies.map((a) => ({ name: a.name.split(" ")[0], revenue: a.revenue_30d }));
  const playerMix = academies.map((a) => ({ name: a.name.split(" ")[0], players: a.players }));
  const healthMix = [
    { name: "Active", value: stats.active_academies_30d || 0 },
    { name: "Idle", value: Math.max(0, (stats.total_academies || 0) - (stats.active_academies_30d || 0)) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12" data-testid="platform-console">
      {/* Hero */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] tracking-[0.25em] uppercase font-bold">PitchPro HQ</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">Platform console</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Cross-academy view of the PitchPro network. Growth, revenue, activity and health of every academy on one screen.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3" data-testid="platform-kpis">
        <Kpi icon={<Building2 />} label="Academies on PitchPro" value={stats.total_academies ?? "—"}
             sub={`${stats.active_academies_30d ?? 0} active (30d)`} tone="primary" />
        <Kpi icon={<Users />} label="Total players" value={stats.total_players ?? "—"}
             sub={`+${stats.new_players_30d ?? 0} last 30d`} />
        <Kpi icon={<GraduationCap />} label="Coaches" value={stats.total_coaches ?? "—"}
             sub={`${stats.total_lanes ?? 0} lanes`} />
        <Kpi icon={<Wallet />} label="GMV (30d)" value={`$${fmt(stats.gmv_30d)}`}
             sub={`${stats.bookings_30d ?? 0} bookings · ${stats.sessions_30d ?? 0} sessions`} tone="primary" />
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Trophy />} label="Fees collected (lifetime)" value={`$${fmt(stats.fees_collected_lifetime)}`} />
        <Kpi icon={<AlertTriangle />} label="Outstanding fees" value={`$${fmt(stats.outstanding_fees)}`}
             sub="money in the pipeline" tone="warning" />
        <Kpi icon={<TrendingUp />} label="New academies (30d)" value={stats.new_academies_30d ?? "—"} />
        <Kpi icon={<Activity />} label="Idle academies"
             value={Math.max(0, (stats.total_academies || 0) - (stats.active_academies_30d || 0))}
             sub="no bookings last 30d" tone="warning" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid lg:grid-cols-3 gap-3">
        <ChartCard title="Platform GMV — 30 days" wide>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="pgmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#pgmv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Academy health">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={healthMix} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                <Cell fill="hsl(var(--chart-2))" />
                <Cell fill="hsl(var(--muted-foreground))" />
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-3 grid lg:grid-cols-2 gap-3">
        <ChartCard title="Revenue by academy (30d)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totalRevChart} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Players by academy">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={playerMix} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12, borderRadius: 12 }} />
              <Bar dataKey="players" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Academy leaderboard */}
      <section className="mt-10" data-testid="platform-leaderboard">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-1">— Leaderboard</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight">Academies on the platform</h2>
          </div>
          <div className="text-xs text-muted-foreground">Ranked by revenue in the last 30 days</div>
        </div>

        <div className="panel-glow overflow-hidden">
          <div className="hidden md:grid grid-cols-12 text-[10px] tracking-[0.25em] uppercase font-bold text-muted-foreground px-5 py-3 border-b border-border">
            <div className="col-span-4">Academy</div>
            <div className="col-span-1 text-center">Players</div>
            <div className="col-span-1 text-center">Coaches</div>
            <div className="col-span-1 text-center">Lanes</div>
            <div className="col-span-2 text-center">Activity (30d)</div>
            <div className="col-span-2 text-right">Revenue (30d)</div>
            <div className="col-span-1 text-right">Outstanding</div>
          </div>
          {academies.map((a, i) => (
            <div key={a.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 py-4 border-b border-border last:border-b-0 items-center"
                 data-testid={`platform-academy-row-${a.slug}`}>
              <div className="col-span-2 md:col-span-4 flex items-center gap-3">
                <div className="hidden md:grid h-9 w-9 rounded-full place-items-center font-display font-black text-sm"
                     style={{ background: `${a.accent_color}22`, color: a.accent_color }}>
                  #{i + 1}
                </div>
                <div>
                  <div className="font-display font-bold uppercase tracking-tight flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: a.accent_color }} />
                    {a.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.city || "—"} · {a.active ? <span className="text-secondary">Active</span> : <span>Idle</span>}
                  </div>
                </div>
              </div>
              <Metric label="Players" value={a.players} mobile />
              <Metric label="Coaches" value={a.coaches} mobile />
              <Metric label="Lanes" value={a.lanes} mobile />
              <div className="md:col-span-2 text-center">
                <div className="font-display text-base font-bold">{a.bookings_30d}<span className="text-xs text-muted-foreground"> b</span> · {a.sessions_30d}<span className="text-xs text-muted-foreground"> s</span></div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground md:hidden">Activity</div>
              </div>
              <div className="md:col-span-2 text-right">
                <div className="font-display text-xl font-bold">${fmt(a.revenue_30d)}</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground md:hidden">Revenue 30d</div>
              </div>
              <div className="md:col-span-1 text-right">
                <div className={`font-display font-bold ${a.outstanding_fees > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  ${fmt(a.outstanding_fees)}
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground md:hidden">Outstanding</div>
              </div>
            </div>
          ))}
          {academies.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No academies yet.</div>}
        </div>
      </section>

      {/* Growth nudges — utility cards */}
      <section className="mt-10 grid md:grid-cols-3 gap-3" data-testid="platform-growth-nudges">
        <NudgeCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Idle academies"
          description={`${Math.max(0, (stats.total_academies || 0) - (stats.active_academies_30d || 0))} academies haven't booked anything in 30 days. Consider reaching out.`}
          tone="warning"
        />
        <NudgeCard
          icon={<Wallet className="h-5 w-5" />}
          title="Money on the table"
          description={`$${fmt(stats.outstanding_fees)} in pending fees across the platform. Send a friendly payment reminder.`}
        />
        <NudgeCard
          icon={<MapPin className="h-5 w-5" />}
          title="Expansion"
          description="3 cities covered. Most platform traffic comes from parents — consider an 'Academy near me' finder on the landing page."
          tone="primary"
        />
      </section>
    </div>
  );
}

function fmt(n) {
  const v = Number(n || 0);
  if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(v % 1 ? 2 : 0);
}

function ChartCard({ title, children, wide }) {
  return (
    <div className={`border border-border bg-card p-5 rounded-2xl ${wide ? "lg:col-span-2" : ""}`}>
      <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary mb-3">— {title}</div>
      <div className="h-60">{children}</div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone }) {
  const tones = {
    primary: "border-primary/40 bg-primary/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
  };
  const iconTones = {
    primary: "bg-primary/15 text-primary",
    warning: "bg-yellow-500/15 text-yellow-500",
  };
  return (
    <div className={`border rounded-2xl p-5 ${tones[tone] || "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-bold">{label}</div>
        <div className={`grid place-items-center h-8 w-8 rounded-xl ${iconTones[tone] || "bg-muted text-foreground"}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 font-display text-4xl font-black tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Metric({ label, value, mobile }) {
  return (
    <div className={`text-center ${mobile ? "" : "hidden md:block"}`}>
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground md:hidden">{label}</div>
    </div>
  );
}

function NudgeCard({ icon, title, description, tone }) {
  const tones = {
    primary: "border-primary/40 bg-primary/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
  };
  const iconTones = {
    primary: "bg-primary/15 text-primary",
    warning: "bg-yellow-500/15 text-yellow-500",
  };
  return (
    <div className={`border rounded-2xl p-5 ${tones[tone] || "border-border bg-card"}`}>
      <div className={`inline-grid place-items-center h-10 w-10 rounded-xl ${iconTones[tone] || "bg-muted text-foreground"}`}>
        {icon}
      </div>
      <div className="mt-4 font-display text-xl font-bold uppercase tracking-tight">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
