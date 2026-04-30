import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, errorMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function Coaching() {
  const location = useLocation();
  const [coaches, setCoaches] = useState([]);
  const [coachId, setCoachId] = useState(location.state?.coachId || null);
  const [date, setDate] = useState(new Date());
  const [info, setInfo] = useState({ available_start_hour: 9, available_end_hour: 19, available_days: [], booked_hours: [] });
  const [hour, setHour] = useState(null);
  const [duration, setDuration] = useState(1);
  const [focus, setFocus] = useState("");
  const [kidName, setKidName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/coaches").then((r) => {
    setCoaches(r.data);
    if (!coachId && r.data[0]) setCoachId(r.data[0].id);
  }); }, []);

  useEffect(() => {
    if (!coachId) return;
    const ds = formatDate(date);
    api.get(`/coaches/${coachId}/availability`, { params: { target_date: ds } })
      .then((r) => setInfo(r.data));
    setHour(null);
  }, [coachId, date]);

  const coach = useMemo(() => coaches.find((c) => c.id === coachId), [coaches, coachId]);
  const weekday = date.getDay() === 0 ? 6 : date.getDay() - 1; // mon=0
  const isAvailableDay = (info.available_days || []).includes(weekday);

  const hours = [];
  for (let h = info.available_start_hour; h < info.available_end_hour; h++) hours.push(h);

  const submit = async () => {
    if (!coachId || hour == null) return toast.error("Pick a coach and time");
    setLoading(true);
    try {
      await api.post("/sessions", {
        coach_id: coachId, session_date: formatDate(date), start_hour: hour,
        duration_hours: duration, focus, kid_name: kidName,
      });
      toast.success("Session booked!");
      const r = await api.get(`/coaches/${coachId}/availability`, { params: { target_date: formatDate(date) } });
      setInfo(r.data); setHour(null); setFocus(""); setKidName("");
    } catch (e) { toast.error(errorMsg(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— 1-1 Coaching</div>
      <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight">Train with a pro</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pick a coach, see availability, book.</p>

      <div className="mt-10 grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-3" data-testid="coaching-coach-list">
          {coaches.map((c) => (
            <button key={c.id} onClick={() => setCoachId(c.id)} data-testid={`select-coach-${c.id}`}
                    className={`w-full text-left border p-4 transition-all ${
                      coachId === c.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/30"
                    }`}>
              <div className="flex gap-3 items-center">
                <img src={c.photo_url} alt="" className="h-14 w-14 object-cover rounded-sm" />
                <div>
                  <div className="font-display text-lg font-black uppercase">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.title} · ${c.hourly_rate}/hr</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-border bg-card p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground mb-3">Select Date</div>
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus
              disabled={{ before: new Date(new Date().toDateString()) }}
              className="rounded-sm" data-testid="coaching-calendar" />
          </div>
          <div className="border border-border bg-card p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground mb-3">
              {coach ? `${coach.name} availability` : "Slots"}
            </div>
            {!isAvailableDay && coach ? (
              <div className="text-sm text-destructive">Coach not available on this day.</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2" data-testid="coach-time-slots">
                {hours.map((h) => {
                  const disabled = info.booked_hours.includes(h);
                  const active = hour === h;
                  return (
                    <button key={h} disabled={disabled}
                            data-testid={`coach-slot-${h}`}
                            onClick={() => setHour(h)}
                            className={`px-2 py-3 text-sm border transition-all font-display tracking-wide ${
                              active ? "border-primary bg-primary text-primary-foreground"
                                    : disabled ? "border-border bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                                    : "border-border bg-card hover:border-primary"
                            }`}>
                      {h}:00
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-5 grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="font-display tracking-[0.2em] uppercase text-xs">Duration</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger className="mt-2 rounded-sm" data-testid="coach-duration-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-display tracking-[0.2em] uppercase text-xs">Focus area</Label>
                <Input className="mt-2 rounded-sm" placeholder="Eg. cover drive" data-testid="coach-focus-input"
                       value={focus} onChange={(e) => setFocus(e.target.value)} />
              </div>
              <div>
                <Label className="font-display tracking-[0.2em] uppercase text-xs">Player name (optional)</Label>
                <Input className="mt-2 rounded-sm" placeholder="Your kid's name" data-testid="coach-kid-input"
                       value={kidName} onChange={(e) => setKidName(e.target.value)} />
              </div>
            </div>
            <Button className="mt-5 rounded-sm font-display tracking-[0.2em] uppercase" disabled={loading || hour == null || !isAvailableDay}
                    onClick={submit} data-testid="confirm-session-button">
              {loading ? "Booking…" : "Confirm Session"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
