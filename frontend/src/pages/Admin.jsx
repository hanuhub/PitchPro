import { useEffect, useState } from "react";
import { api, errorMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Send, Plus, Megaphone } from "lucide-react";

export default function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [lanes, setLanes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [games, setGames] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const reload = async () => {
    const [s, u, l, c, b, p, g, a] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/users"),
      api.get("/lanes"),
      api.get("/coaches"),
      api.get("/bookings"),
      api.get("/progress"),
      api.get("/games"),
      api.get("/announcements"),
    ]);
    setStats(s.data); setUsers(u.data); setLanes(l.data); setCoaches(c.data);
    setBookings(b.data); setProgressList(p.data); setGames(g.data); setAnnouncements(a.data);
  };

  useEffect(() => { reload(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Admin Console</div>
      <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight">Control room</h1>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="admin-stats">
        <KPI label="Users" value={stats.users} />
        <KPI label="Lanes" value={stats.lanes} />
        <KPI label="Coaches" value={stats.coaches} />
        <KPI label="Bookings" value={stats.bookings_active} />
        <KPI label="Sessions" value={stats.sessions_active} />
        <KPI label="Reports" value={stats.progress_reports} />
        <KPI label="Games" value={stats.games} />
      </div>

      <Tabs defaultValue="lanes" className="mt-10">
        <TabsList className="bg-card border border-border rounded-sm flex-wrap h-auto" data-testid="admin-tabs">
          <TabsTrigger value="lanes" className="font-display tracking-[0.2em] uppercase text-xs">Lanes</TabsTrigger>
          <TabsTrigger value="coaches" className="font-display tracking-[0.2em] uppercase text-xs">Coaches</TabsTrigger>
          <TabsTrigger value="users" className="font-display tracking-[0.2em] uppercase text-xs">Users</TabsTrigger>
          <TabsTrigger value="bookings" className="font-display tracking-[0.2em] uppercase text-xs">Bookings</TabsTrigger>
          <TabsTrigger value="progress" className="font-display tracking-[0.2em] uppercase text-xs">Progress</TabsTrigger>
          <TabsTrigger value="games" className="font-display tracking-[0.2em] uppercase text-xs">Games</TabsTrigger>
          <TabsTrigger value="ann" className="font-display tracking-[0.2em] uppercase text-xs">Announce</TabsTrigger>
        </TabsList>

        <TabsContent value="lanes" className="mt-6"><LanesTab lanes={lanes} reload={reload} /></TabsContent>
        <TabsContent value="coaches" className="mt-6"><CoachesTab coaches={coaches} reload={reload} /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab users={users} /></TabsContent>
        <TabsContent value="bookings" className="mt-6"><BookingsTab bookings={bookings} /></TabsContent>
        <TabsContent value="progress" className="mt-6">
          <ProgressTab users={users} coaches={coaches} list={progressList} reload={reload} />
        </TabsContent>
        <TabsContent value="games" className="mt-6"><GamesTab games={games} reload={reload} /></TabsContent>
        <TabsContent value="ann" className="mt-6"><AnnouncementsTab list={announcements} reload={reload} users={users} /></TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-black">{value ?? 0}</div>
    </div>
  );
}

/* -------- Lanes -------- */
function LanesTab({ lanes, reload }) {
  const [form, setForm] = useState({ name: "", surface: "turf", indoor: false, hourly_rate: 25, description: "" });
  const create = async () => {
    try { await api.post("/lanes", form); toast.success("Lane added"); reload();
      setForm({ name: "", surface: "turf", indoor: false, hourly_rate: 25, description: "" });
    } catch (e) { toast.error(errorMsg(e)); }
  };
  const remove = async (id) => {
    if (!confirm("Delete lane?")) return;
    try { await api.delete(`/lanes/${id}`); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(errorMsg(e)); }
  };
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 border border-border bg-card divide-y divide-border" data-testid="admin-lanes-list">
        {lanes.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-display text-lg font-bold uppercase">{l.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{l.surface} · {l.indoor ? "Indoor" : "Outdoor"} · ${l.hourly_rate}/hr</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(l.id)} data-testid={`delete-lane-${l.id}`}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {lanes.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No lanes yet</div>}
      </div>
      <div className="border border-border bg-card p-5 space-y-3">
        <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Add lane</div>
        <Input placeholder="Name" data-testid="new-lane-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Select value={form.surface} onValueChange={(v) => setForm({ ...form, surface: v })}>
          <SelectTrigger data-testid="new-lane-surface"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["turf", "cement", "matting", "synthetic"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm">
          <input type="checkbox" id="indoor" checked={form.indoor} onChange={(e) => setForm({ ...form, indoor: e.target.checked })} />
          <Label htmlFor="indoor">Indoor</Label>
        </div>
        <Input type="number" placeholder="Hourly rate" data-testid="new-lane-rate" value={form.hourly_rate}
               onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
        <Textarea placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Button className="w-full rounded-sm font-display tracking-[0.2em] uppercase" onClick={create} data-testid="add-lane-button">
          <Plus className="h-4 w-4 mr-2" /> Add Lane
        </Button>
      </div>
    </div>
  );
}

/* -------- Coaches -------- */
function CoachesTab({ coaches, reload }) {
  const [form, setForm] = useState({
    name: "", title: "", bio: "", specialties: "", photo_url: "",
    awards: "", hourly_rate: 50, available_start_hour: 9, available_end_hour: 19,
  });
  const create = async () => {
    try {
      await api.post("/coaches", {
        name: form.name, title: form.title, bio: form.bio,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        photo_url: form.photo_url || null,
        awards: form.awards.split(",").map((s) => s.trim()).filter(Boolean),
        available_days: [1, 2, 3, 4, 5],
        available_start_hour: Number(form.available_start_hour),
        available_end_hour: Number(form.available_end_hour),
        hourly_rate: Number(form.hourly_rate),
      });
      toast.success("Coach added"); reload();
    } catch (e) { toast.error(errorMsg(e)); }
  };
  const remove = async (id) => {
    if (!confirm("Delete coach?")) return;
    try { await api.delete(`/coaches/${id}`); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(errorMsg(e)); }
  };
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 border border-border bg-card divide-y divide-border">
        {coaches.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={c.photo_url} alt="" className="h-12 w-12 rounded-sm object-cover" />
              <div>
                <div className="font-display text-lg font-bold uppercase">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.title} · ${c.hourly_rate}/hr</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="border border-border bg-card p-5 space-y-3">
        <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Add coach</div>
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea placeholder="Bio" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <Input placeholder="Photo URL" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
        <Input placeholder="Specialties (comma)" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} />
        <Input placeholder="Awards (comma)" value={form.awards} onChange={(e) => setForm({ ...form, awards: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" value={form.available_start_hour} onChange={(e) => setForm({ ...form, available_start_hour: e.target.value })} />
          <Input type="number" value={form.available_end_hour} onChange={(e) => setForm({ ...form, available_end_hour: e.target.value })} />
          <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
        </div>
        <Button className="w-full rounded-sm font-display tracking-[0.2em] uppercase" onClick={create}>
          <Plus className="h-4 w-4 mr-2" /> Add Coach
        </Button>
      </div>
    </div>
  );
}

/* -------- Users -------- */
function UsersTab({ users }) {
  return (
    <div className="border border-border bg-card divide-y divide-border" data-testid="admin-users-list">
      {users.map((u) => (
        <div key={u.id} className="px-4 py-3 grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
          <div className="font-display font-bold">{u.name}</div>
          <div className="text-sm text-muted-foreground">{u.email}</div>
          <div className="text-xs"><span className={`px-2 py-0.5 border ${u.role === "admin" ? "border-primary text-primary" : u.role === "coach" ? "border-secondary text-secondary" : "border-border text-muted-foreground"}`}>{u.role}</span></div>
          <div className="text-xs text-muted-foreground">{u.phone || "—"}</div>
          <div className="text-xs text-muted-foreground">{u.kids?.length || 0} kid(s)</div>
        </div>
      ))}
    </div>
  );
}

/* -------- Bookings -------- */
function BookingsTab({ bookings }) {
  return (
    <div className="border border-border bg-card divide-y divide-border" data-testid="admin-bookings">
      {bookings.map((b) => (
        <div key={b.id} className="px-4 py-3 grid grid-cols-2 md:grid-cols-5 gap-3 items-center text-sm">
          <div className="font-display font-bold uppercase">{b.lane_name}</div>
          <div>{b.user_name}</div>
          <div className="text-muted-foreground">{b.booking_date} · {b.start_hour}:00</div>
          <div>${b.total_price}</div>
          <div className={`text-xs uppercase tracking-[0.2em] font-bold ${b.status === "cancelled" ? "text-destructive" : "text-secondary"}`}>{b.status}</div>
        </div>
      ))}
      {bookings.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No bookings yet</div>}
    </div>
  );
}

/* -------- Progress -------- */
function ProgressTab({ users, coaches, list, reload }) {
  const [form, setForm] = useState({
    user_id: "", kid_name: "", period_type: "weekly", period_label: "",
    coach_id: "", batting_score: 70, bowling_score: 70, fielding_score: 70, fitness_score: 70,
    summary: "", strengths: "", areas_to_improve: "",
  });
  const submit = async () => {
    try {
      await api.post("/progress", {
        ...form,
        coach_id: form.coach_id || null,
        batting_score: Number(form.batting_score), bowling_score: Number(form.bowling_score),
        fielding_score: Number(form.fielding_score), fitness_score: Number(form.fitness_score),
        strengths: form.strengths.split(",").map((s) => s.trim()).filter(Boolean),
        areas_to_improve: form.areas_to_improve.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Progress published — sent to inbox");
      reload();
      setForm({ ...form, kid_name: "", period_label: "", summary: "", strengths: "", areas_to_improve: "" });
    } catch (e) { toast.error(errorMsg(e)); }
  };
  const targetUser = users.find((u) => u.id === form.user_id);
  const kidsOptions = targetUser?.kids?.map((k) => k.name) || [];
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="border border-border bg-card p-5 space-y-3" data-testid="progress-form">
        <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Publish report</div>
        <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v, kid_name: "" })}>
          <SelectTrigger data-testid="progress-user-select"><SelectValue placeholder="Parent" /></SelectTrigger>
          <SelectContent>
            {users.filter((u) => u.role === "user").map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {kidsOptions.length > 0 ? (
          <Select value={form.kid_name} onValueChange={(v) => setForm({ ...form, kid_name: v })}>
            <SelectTrigger><SelectValue placeholder="Kid" /></SelectTrigger>
            <SelectContent>
              {kidsOptions.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input placeholder="Kid name" value={form.kid_name} onChange={(e) => setForm({ ...form, kid_name: e.target.value })} />
        )}
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.period_type} onValueChange={(v) => setForm({ ...form, period_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Period (e.g. Week 12 - 2026)" value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} />
        </div>
        <Select value={form.coach_id} onValueChange={(v) => setForm({ ...form, coach_id: v })}>
          <SelectTrigger><SelectValue placeholder="Coach (optional)" /></SelectTrigger>
          <SelectContent>{coaches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="grid grid-cols-4 gap-2">
          {["batting_score", "bowling_score", "fielding_score", "fitness_score"].map((k) => (
            <div key={k}>
              <Label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{k.replace("_score", "")}</Label>
              <Input type="number" min={0} max={100} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>
        <Textarea placeholder="Summary" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <Input placeholder="Strengths (comma)" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
        <Input placeholder="Areas to improve (comma)" value={form.areas_to_improve} onChange={(e) => setForm({ ...form, areas_to_improve: e.target.value })} />
        <Button className="w-full rounded-sm font-display tracking-[0.2em] uppercase" onClick={submit} data-testid="publish-progress-button">
          <Send className="h-4 w-4 mr-2" /> Publish & Notify
        </Button>
      </div>
      <div className="space-y-2 max-h-[80vh] overflow-y-auto" data-testid="admin-progress-list">
        {list.map((p) => (
          <div key={p.id} className="border border-border bg-card p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold">{p.period_type} · {p.period_label}</div>
            <div className="font-display text-xl font-bold uppercase">{p.kid_name}</div>
            <div className="text-xs text-muted-foreground">{p.user_name} ({p.user_email})</div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
              <Stat n={p.batting_score} l="Bat" />
              <Stat n={p.bowling_score} l="Bowl" />
              <Stat n={p.fielding_score} l="Field" />
              <Stat n={p.fitness_score} l="Fit" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground italic">"{p.summary}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div className="border border-border p-2">
      <div className="font-display text-2xl font-black">{n}</div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{l}</div>
    </div>
  );
}

/* -------- Games -------- */
function GamesTab({ games, reload }) {
  const [form, setForm] = useState({
    title: "", game_date: "", start_time: "09:00", ground_name: "", ground_address: "",
    gps_lat: "", gps_lng: "", team_a: "", team_b: "", notes: "",
  });
  const create = async () => {
    try {
      await api.post("/games", {
        ...form,
        gps_lat: form.gps_lat ? Number(form.gps_lat) : null,
        gps_lng: form.gps_lng ? Number(form.gps_lng) : null,
        team_a: form.team_a.split(",").map((s) => s.trim()).filter(Boolean),
        team_b: form.team_b.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Game created"); reload();
      setForm({ ...form, title: "", game_date: "", ground_name: "", ground_address: "", team_a: "", team_b: "", notes: "" });
    } catch (e) { toast.error(errorMsg(e)); }
  };
  const remove = async (id) => {
    if (!confirm("Delete game?")) return;
    try { await api.delete(`/games/${id}`); reload(); } catch (e) { toast.error(errorMsg(e)); }
  };
  const notify = async (id) => {
    try { const r = await api.post(`/games/${id}/notify`); toast.success(`Sent to ${r.data.recipients} members (mocked)`); }
    catch (e) { toast.error(errorMsg(e)); }
  };
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3" data-testid="admin-games-list">
        {games.map((g) => (
          <div key={g.id} className="border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-xl font-bold uppercase">{g.title}</div>
              <div className="text-xs text-muted-foreground">{g.game_date} · {g.start_time} · {g.ground_name}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-sm" onClick={() => notify(g.id)} data-testid={`notify-game-${g.id}`}>
                <Megaphone className="h-4 w-4 mr-1" /> Notify
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-border bg-card p-5 space-y-3">
        <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Add game</div>
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input type="date" value={form.game_date} onChange={(e) => setForm({ ...form, game_date: e.target.value })} />
        <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <Input placeholder="Ground name" value={form.ground_name} onChange={(e) => setForm({ ...form, ground_name: e.target.value })} />
        <Input placeholder="Ground address" value={form.ground_address} onChange={(e) => setForm({ ...form, ground_address: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="GPS lat" value={form.gps_lat} onChange={(e) => setForm({ ...form, gps_lat: e.target.value })} />
          <Input placeholder="GPS lng" value={form.gps_lng} onChange={(e) => setForm({ ...form, gps_lng: e.target.value })} />
        </div>
        <Textarea placeholder="Team A (comma names)" rows={2} value={form.team_a} onChange={(e) => setForm({ ...form, team_a: e.target.value })} />
        <Textarea placeholder="Team B (comma names)" rows={2} value={form.team_b} onChange={(e) => setForm({ ...form, team_b: e.target.value })} />
        <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <Button className="w-full rounded-sm font-display tracking-[0.2em] uppercase" onClick={create}>
          <Plus className="h-4 w-4 mr-2" /> Add Game
        </Button>
      </div>
    </div>
  );
}

/* -------- Announcements -------- */
function AnnouncementsTab({ list, reload, users }) {
  const [form, setForm] = useState({ channel: "in-app", audience: "all", subject: "", message: "" });
  const send = async () => {
    try {
      const r = await api.post("/announcements", form);
      toast.success(`Sent to ${r.data.recipients} ${r.data.mocked ? "(mocked)" : ""}`);
      reload();
      setForm({ ...form, subject: "", message: "" });
    } catch (e) { toast.error(errorMsg(e)); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="border border-border bg-card p-5 space-y-3" data-testid="announce-form">
        <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-primary">— Compose</div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
            <SelectTrigger data-testid="announce-channel"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in-app">In-App</SelectItem>
              <SelectItem value="email">Email (mocked)</SelectItem>
              <SelectItem value="whatsapp">WhatsApp (mocked)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
            <SelectTrigger data-testid="announce-audience"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="users">Users only</SelectItem>
              <SelectItem value="coaches">Coaches only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="announce-subject" />
        <Textarea placeholder="Message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="announce-message" />
        <Button className="w-full rounded-sm font-display tracking-[0.2em] uppercase" onClick={send} data-testid="announce-send">
          <Send className="h-4 w-4 mr-2" /> Send
        </Button>
        <p className="text-xs text-muted-foreground">
          Email & WhatsApp channels are MOCKED for MVP — messages are logged in the system and shown in user inboxes.
        </p>
      </div>
      <div className="space-y-2 max-h-[80vh] overflow-y-auto" data-testid="announce-history">
        {list.map((a) => (
          <div key={a.id} className="border border-border bg-card p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase text-primary font-bold">{a.channel} · {a.audience} · {a.recipients?.length} recipients{a.mocked ? " (mocked)" : ""}</div>
            <div className="font-display text-lg font-bold uppercase">{a.subject}</div>
            <p className="text-sm text-muted-foreground">{a.message}</p>
            <div className="mt-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
