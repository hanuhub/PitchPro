export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl font-black uppercase tracking-tight">Crease Academy</div>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            High-performance cricket coaching, lane bookings, weekend matches and player development —
            built for the next generation of cricketers.
          </p>
        </div>
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary">Visit</div>
          <p className="mt-3 text-sm text-muted-foreground">12 Stadium Lane<br/>Sportsville</p>
        </div>
        <div>
          <div className="text-xs tracking-[0.3em] uppercase font-bold text-primary">Hours</div>
          <p className="mt-3 text-sm text-muted-foreground">Mon–Fri 6 am – 10 pm<br/>Sat–Sun 7 am – 9 pm</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Crease Academy. Built for cricket lovers.
      </div>
    </footer>
  );
}
