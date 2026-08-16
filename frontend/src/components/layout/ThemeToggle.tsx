"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
}

/** Day/Night switch: the night desk is the default; this is the gate to the
 *  cream paper day sheet. The moon/sun crossfade keeps the action a quiet
 *  stamp-ink moment rather than a color event. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("relative", className)}
    >
      <span className="relative grid size-5 place-items-center" aria-hidden="true">
        <Moon
          className={cn(
            "absolute size-4 transition-all duration-300 motion-reduce:transition-none",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-50 opacity-0",
          )}
        />
        <Sun
          className={cn(
            "absolute size-4 transition-all duration-300 motion-reduce:transition-none",
            isDark
              ? "-rotate-90 scale-50 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          )}
        />
      </span>
    </Button>
  );
}