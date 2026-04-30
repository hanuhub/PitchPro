import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Clock, User } from "lucide-react";

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 6..21

export default function Staff() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [lanes, setLanes] = useState([]);
  const [coaches, setCoaches] = useState([]);

  const ds = formatDate(date);

  const reload = async () => {
    const [l, c] = await Promise.all([
      api.get(`/staff/lane-usage`, { params: { target_date: ds } }),
      api.get(`/staff/coach-usage`, { params: { target_date: ds } }),
    ]);
    setLanes(l.data); setCoaches(c.data);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [ds]);

  const totals = useMemo(() => {
    let booked = 0, free = 0;
    lanes.forEach((l) => {
      const busy = new Set(l.slots.map((s) => s.hour));
      HOURS.forEach((h) => (busy.has(h) ? booked++ : free++));
    });
    let coachBooked = 0, coachFree = 0;
    coaches.forEach((c) => {
      const start = c.available_start_hour, end = c.available_end_hour;
      if (!c.available_today) return;
      const busy = new Set(c.slots.map((s) => s.hour));
      for (let h = start; h < end; h++) busy.has(h) ? coachBooked++ : coachFree++;
    });
    return { laneBooked: booked, laneFree: free, coachBooked, coachFree };
  }, [lanes, coaches]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Academy operations</div>
      <h1 className="font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">
        Hello, {user?.name?.split(" ")[0]}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Lane usage, coach availability and free / busy slots — at a glance.</p>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Lane hrs free" value={totals.laneFree} tone="secondary" />
        <Kpi label="Lane hrs booked" value={totals.laneBooked} tone="primary" />
        <Kpi label="Coach hrs free" value={totals.coachFree} tone="secondary" />
        <Kpi label="Coach hrs booked" value={totals.coachBooked} tone="primary" />
      </div>

      <div className="mt-10 grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 border border-border bg-card p-3 h-fit">
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground mb-2">Select date</div>
          <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="rounded-sm" />
        </div>

        <div className="lg:col-span-9">
          <Tabs defaultValue="lanes">
            <TabsList className="bg-card border border-border rounded-sm">
              <TabsTrigger value="lanes" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="staff-tab-lanes">Lane usage</TabsTrigger>
              <TabsTrigger value="coaches" className="font-display tracking-[0.2em] uppercase text-xs" data-testid="staff-tab-coaches">Coach slots</TabsTrigger>
            </TabsList>

            <TabsContent value="lanes" className="mt-4">
              <Matrix
                rows={lanes.map((l) => ({
                  id: l.id, label: l.name, sub: `${l.surface}${l.indoor ? " · indoor" : ""} · $${l.hourly_rate}/hr`,
                  windowStart: 6, windowEnd: 22, slots: l.slots,
                  available: true,
                }))}
                emptyText="No lanes configured."
                slotKey="user_name"
                testid="lane-matrix"
              />
            </TabsContent>

            <TabsContent value="coaches" className="mt-4">
              <Matrix
                rows={coaches.map((c) => ({
                  id: c.id, label: c.name, sub: c.title,
                  windowStart: c.available_start_hour, windowEnd: c.available_end_hour,
                  slots: c.slots, available: c.available_today,
                }))}
                emptyText="No coaches today."
                slotKey="user_name"
                testid="coach-matrix"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Matrix({ rows, emptyText, testid }) {
  return (
    <div className="border border-border bg-card overflow-x-auto" data-testid={testid}>
      {rows.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">{emptyText}</div>}
      <table className="min-w-full text-sm">
        {rows.length > 0 && (
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-bold">Resource</th>
              {HOURS.map((h) => (
                <th key={h} className="p-1 text-[10px] text-muted-foreground font-mono w-12">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r) => {
            const busyMap = new Map(r.slots.map((s) => [s.hour, s]));
            return (
              <tr key={r.id} className="border-b border-border/50">
                <td className="p-3 align-top">
                  <div className="font-display text-base font-bold uppercase">{r.label}</div>
                  <div className="text-xs text-muted-foreground capitalize">{r.sub}</div>
                  {!r.available && <div className="mt-1 text-[10px] tracking-[0.2em] uppercase text-destructive">Off today</div>}
                </td>
                {HOURS.map((h) => {
                  const inWindow = h >= r.windowStart && h < r.windowEnd && r.available;
                  const busy = busyMap.get(h);
                  let cls = "bg-muted/40 border border-border/40"; // outside window
                  let title = "";
                  let content = null;
                  if (inWindow && busy) {
                    cls = "bg-primary/85 border border-primary text-primary-foreground";
                    title = busy.user_name || "Booked";
                    content = <User className="h-3 w-3 mx-auto" />;
                  } else if (inWindow) {
                    cls = "bg-secondary/15 border border-secondary/40 text-secondary";
                    content = <CheckCircle2 className="h-3 w-3 mx-auto" />;
                  }
                  return (
                    <td key={h} className="p-0.5 align-top">
                      <div title={title} className={`h-9 grid place-items-center text-xs ${cls}`}>{content}</div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-4 p-3 text-xs text-muted-foreground border-t border-border">
          <Legend cls="bg-secondary/15 border-secondary/40 text-secondary" label="Free" icon={<CheckCircle2 className="h-3 w-3" />} />
          <Legend cls="bg-primary/85 border-primary text-primary-foreground" label="Booked" icon={<User className="h-3 w-3" />} />
          <Legend cls="bg-muted/40 border-border/40" label="Outside hours" />
        </div>
      )}
    </div>
  );
}

function Legend({ cls, label, icon }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex h-5 w-7 items-center justify-center border ${cls}`}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Kpi({ label, value, tone }) {
  const cls = tone === "primary" ? "border-primary/50" : tone === "secondary" ? "border-secondary/50" : "border-border";
  return (
    <div className={`border ${cls} bg-card p-5`}>
      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span className="text-[10px] tracking-[0.3em] uppercase">{label}</span></div>
      <div className="mt-2 font-display text-4xl font-bold">{value}</div>
    </div>
  );
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
