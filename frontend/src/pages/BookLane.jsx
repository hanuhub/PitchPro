import { useEffect, useMemo, useState } from "react";
import { api, errorMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 6..21

export default function BookLane() {
  const [lanes, setLanes] = useState([]);
  const [laneId, setLaneId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [bookedHours, setBookedHours] = useState([]);
  const [startHour, setStartHour] = useState(null);
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/lanes").then((r) => { setLanes(r.data); if (r.data[0]) setLaneId(r.data[0].id); }); }, []);

  useEffect(() => {
    if (!laneId) return;
    const ds = formatDate(date);
    api.get(`/lanes/${laneId}/availability`, { params: { target_date: ds } })
      .then((r) => setBookedHours(r.data.booked_hours || []));
    setStartHour(null);
  }, [laneId, date]);

  const lane = useMemo(() => lanes.find((l) => l.id === laneId), [lanes, laneId]);

  const submit = async () => {
    if (!laneId || startHour == null) return toast.error("Pick a lane and a time slot");
    setLoading(true);
    try {
      await api.post("/bookings", {
        lane_id: laneId, booking_date: formatDate(date), start_hour: startHour,
        duration_hours: duration, notes,
      });
      toast.success("Booking confirmed! Check your inbox.");
      const r = await api.get(`/lanes/${laneId}/availability`, { params: { target_date: formatDate(date) } });
      setBookedHours(r.data.booked_hours || []);
      setStartHour(null); setNotes("");
    } catch (e) {
      toast.error(errorMsg(e));
    } finally { setLoading(false); }
  };

  const isBooked = (h) => bookedHours.includes(h);
  const isPast = (h) => {
    const today = new Date();
    return formatDate(today) === formatDate(date) && h <= today.getHours();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
      <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary mb-3">— Lane booking</div>
      <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-tight">Book your lane</h1>
      <p className="mt-2 text-sm text-muted-foreground">Modify or cancel up to 24 hours before. All times local.</p>

      <div className="mt-10 grid lg:grid-cols-12 gap-4">
        {/* Lane select */}
        <div className="lg:col-span-4 space-y-3" data-testid="lane-list">
          <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground">Choose Lane</div>
          {lanes.map((l) => (
            <button
              key={l.id}
              data-testid={`select-lane-${l.id}`}
              onClick={() => setLaneId(l.id)}
              className={`w-full text-left border p-4 transition-all ${
                laneId === l.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-black uppercase">{l.name}</div>
                <div className="text-sm font-bold">${l.hourly_rate}/hr</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1 capitalize">
                {l.surface} · {l.indoor ? "Indoor" : "Outdoor"}
              </div>
              {l.description && <div className="text-xs text-muted-foreground mt-2">{l.description}</div>}
            </button>
          ))}
        </div>

        {/* Calendar + slots */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-border bg-card p-4">
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground mb-3">Select Date</div>
            <Calendar
              mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus
              disabled={{ before: new Date(new Date().toDateString()) }}
              className="rounded-sm" data-testid="booking-calendar"
            />
          </div>
          <div className="border border-border bg-card p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground mb-3">Available Slots</div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2" data-testid="time-slots">
              {HOURS.map((h) => {
                const disabled = isBooked(h) || isPast(h);
                const active = startHour === h;
                return (
                  <button key={h} disabled={disabled}
                          data-testid={`slot-${h}`}
                          onClick={() => setStartHour(h)}
                          className={`px-2 py-3 text-sm border transition-all font-display tracking-wide ${
                            active ? "border-primary bg-primary text-primary-foreground"
                                  : disabled ? "border-border bg-muted text-muted-foreground/40 cursor-not-allowed line-through"
                                  : "border-border bg-card hover:border-primary"
                          }`}>
                    {h}:00
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-display tracking-[0.2em] uppercase text-xs">Duration</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                  <SelectTrigger className="mt-2 rounded-sm" data-testid="duration-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-display tracking-[0.2em] uppercase text-xs">Notes</Label>
                <Input className="mt-2 rounded-sm" placeholder="Eg. need bowling machine" data-testid="booking-notes"
                       value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            {lane && startHour != null && (
              <div className="mt-5 border border-primary/30 bg-primary/5 p-4 text-sm flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <div>
                  Booking <b>{lane.name}</b> on <b>{formatDate(date)}</b> from <b>{startHour}:00</b> to <b>{startHour + duration}:00</b>.
                  Total <b>${(lane.hourly_rate * duration).toFixed(2)}</b>.
                </div>
              </div>
            )}
            <Button className="mt-5 rounded-sm font-display tracking-[0.2em] uppercase" disabled={loading || startHour == null}
                    onClick={submit} data-testid="confirm-booking-button">
              {loading ? "Booking…" : "Confirm Booking"}
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
