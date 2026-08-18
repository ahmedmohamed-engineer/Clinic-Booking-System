"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("theme");
  const isDark = theme === "dark";
  const label = isDark ? t("toLight") : t("toDark");

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
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