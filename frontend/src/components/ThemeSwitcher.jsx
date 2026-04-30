import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const active = themes.find((t) => t.id === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="theme-switcher-trigger"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-display tracking-[0.2em] uppercase font-bold hover:border-primary transition-colors"
        >
          <span
            className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
            style={{ background: active.color }}
            aria-hidden
          />
          <Palette className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{active.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl">
        <DropdownMenuLabel className="font-display tracking-[0.2em] uppercase text-xs">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            data-testid={`theme-option-${t.id}`}
            className="rounded-lg cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <span
                className="h-3 w-3 rounded-full ring-2 ring-background shrink-0"
                style={{ background: t.color }}
              />
              <div className="flex-1">
                <div className="font-bold leading-tight">{t.name}</div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{t.desc}</div>
              </div>
              {theme === t.id && <Check className="h-4 w-4 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
