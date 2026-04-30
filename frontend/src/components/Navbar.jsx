import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

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
      {isAuth && (user.role === "admin" || user.role === "coach") && (
        <NavLink to="/staff" className={navLinkClass} data-testid="nav-staff">Operations</NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-link">
          <div className="grid h-9 w-9 place-items-center bg-primary rounded-2xl">
            <span className="font-display text-2xl font-bold leading-none text-primary-foreground">P</span>
          </div>
          <div className="leading-none">
            <div className="font-display text-2xl font-bold uppercase tracking-tight">PitchPro</div>
            <div className="text-[9px] tracking-[0.32em] text-muted-foreground uppercase mt-0.5">Academy Platform</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">{links}</nav>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {!isAuth ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full" data-testid="login-cta">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-5" data-testid="register-cta">
                <Link to="/register">Join an Academy</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="user-menu" className="rounded-full">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold uppercase">
                    {(user.name || "U").charAt(0)}
                  </span>
                  <span className="ml-2 hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="font-display tracking-wide uppercase text-xs">
                  {user.email}
                </DropdownMenuLabel>
                {user.academy_name && (
                  <DropdownMenuLabel className="text-xs text-muted-foreground -mt-2">
                    {user.academy_name}
                  </DropdownMenuLabel>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard" className="rounded-lg">
                  Dashboard
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin" className="rounded-lg">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }} data-testid="menu-logout" className="rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            className="md:hidden p-2 rounded-full border border-border"
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
