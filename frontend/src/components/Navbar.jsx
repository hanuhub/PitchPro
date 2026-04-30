import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAuth = user && typeof user === "object";

  const navLinkClass = ({ isActive }) =>
    `text-[13px] tracking-[0.18em] uppercase font-bold transition-colors duration-150 ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  const links = (
    <>
      <NavLink to="/" end className={navLinkClass} data-testid="nav-home">Home</NavLink>
      <NavLink to="/about" className={navLinkClass} data-testid="nav-about">Academy</NavLink>
      <NavLink to="/coaches" className={navLinkClass} data-testid="nav-coaches">Coaches</NavLink>
      <NavLink to="/games" className={navLinkClass} data-testid="nav-games">Games</NavLink>
      {isAuth && (
        <NavLink to="/dashboard" className={navLinkClass} data-testid="nav-dashboard">Dashboard</NavLink>
      )}
      {isAuth && user.role === "admin" && (
        <NavLink to="/admin" className={navLinkClass} data-testid="nav-admin">Admin</NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
          <div className="grid h-8 w-8 place-items-center bg-primary">
            <span className="font-display text-xl font-black text-primary-foreground">C</span>
          </div>
          <div className="leading-none">
            <div className="font-display text-xl font-black uppercase tracking-tight">Crease</div>
            <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Academy</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">{links}</nav>

        <div className="flex items-center gap-3">
          {!isAuth ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex" data-testid="login-cta">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-sm" data-testid="register-cta">
                <Link to="/register">Join Academy</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="user-menu" className="rounded-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground font-display font-black uppercase">
                    {(user.name || "U").charAt(0)}
                  </span>
                  <span className="ml-2 hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-display tracking-wide uppercase">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard">
                  Dashboard
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }} data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            className="md:hidden p-2 rounded-sm border border-border"
            onClick={() => setOpen(!open)}
            data-testid="mobile-menu-toggle"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="flex flex-col gap-4 px-4 py-4" onClick={() => setOpen(false)}>
            {links}
          </div>
        </div>
      )}
    </header>
  );
}
