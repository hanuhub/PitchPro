import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, ShieldCheck, Users, Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAuth = user && typeof user === "object";

  const navLinkClass = ({ isActive }) =>
    `text-[13px] tracking-[0.18em] uppercase font-bold transition-colors duration-150 ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  // Public (unauthenticated) nav: platform-only links. No Coaches / Games / Academy here —
  // those belong inside an academy context, after sign-in.
  const publicLinks = (
    <>
      <NavLink to="/" end className={navLinkClass} data-testid="nav-home">Home</NavLink>
      <a href="/#academies" className="text-[13px] tracking-[0.18em] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-academies">
        Academies
      </a>
      <a href="/#modules" className="text-[13px] tracking-[0.18em] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-platform">
        Platform
      </a>
    </>
  );

  // Authenticated nav: role-aware. Dashboard goes to the console for the user's role.
  // No public-site links like "Academy" (About) here — that's only for the landing page.
  const dashboardHref =
    isAuth && (user.role === "platform_admin" || user.role === "academy_admin")
      ? "/admin"
      : isAuth && user.role === "coach"
      ? "/staff"
      : "/dashboard";

  const authedLinks = (
    <>
      <NavLink to={dashboardHref} end className={navLinkClass} data-testid="nav-dashboard">Dashboard</NavLink>
      <NavLink to="/coaches" className={navLinkClass} data-testid="nav-coaches">Coaches</NavLink>
      <NavLink to="/games" className={navLinkClass} data-testid="nav-games">Games</NavLink>
      {isAuth && (user.role === "platform_admin" || user.role === "academy_admin" || user.role === "coach") && (
        <NavLink to="/staff" className={navLinkClass} data-testid="nav-staff">Operations</NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-link">
          <Logo variant="icon" className="h-10 w-auto" />
          <div className="leading-none">
            <div className="font-display text-2xl font-bold uppercase tracking-tight">PitchPro</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {isAuth ? authedLinks : publicLinks}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {!isAuth ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="rounded-full px-5 hidden sm:inline-flex" data-testid="nav-login-dropdown">
                    Login <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1" data-testid="login-dropdown-menu">
                  <DropdownMenuLabel className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground px-3 pt-2">
                    Choose your role
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/academy/login?demo=academy")} className="rounded-xl p-3 cursor-pointer" data-testid="login-option-academy">
                    <Building2 className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="font-display tracking-[0.15em] uppercase text-xs font-bold">Academy login</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">pyare_mohan@pitchpro.com</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/login?demo=parent")} className="rounded-xl p-3 cursor-pointer" data-testid="login-option-player">
                    <Users className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="font-display tracking-[0.15em] uppercase text-xs font-bold">Player login</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">veer_hanumaan@pitchpro.com</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/academy/login?demo=platform")} className="rounded-xl p-3 cursor-pointer" data-testid="login-option-platform">
                    <ShieldCheck className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="font-display tracking-[0.15em] uppercase text-xs font-bold">Platform login</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">admin@pitchpro.com</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild size="sm" variant="outline" className="rounded-full px-4 border-foreground/30 hidden lg:inline-flex" data-testid="register-cta">
                <Link to="/register">Sign up</Link>
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
                  <DropdownMenuLabel className="text-xs text-muted-foreground -mt-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: user.academy_accent_color || "currentColor" }} />
                    {user.academy_name}
                  </DropdownMenuLabel>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardHref)} data-testid="menu-dashboard" className="rounded-lg">
                  Dashboard
                </DropdownMenuItem>
                {(user.role === "platform_admin" || user.role === "academy_admin") && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin" className="rounded-lg">
                    <ShieldCheck className="mr-2 h-4 w-4" /> {user.role === "platform_admin" ? "Platform Console" : "Academy Console"}
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
            {isAuth ? authedLinks : publicLinks}
            {!isAuth && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground px-1 pt-1">Login as</div>
                <Button asChild size="sm" className="rounded-full justify-start" data-testid="mobile-academy-login">
                  <Link to="/academy/login?demo=academy"><Building2 className="mr-1.5 h-3.5 w-3.5" /> Academy login</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="rounded-full justify-start border border-border" data-testid="mobile-player-login">
                  <Link to="/login?demo=parent"><Users className="mr-1.5 h-3.5 w-3.5" /> Player login</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="rounded-full justify-start border border-border" data-testid="mobile-platform-login">
                  <Link to="/academy/login?demo=platform"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Platform login</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full border-foreground/30" data-testid="mobile-register-cta">
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
