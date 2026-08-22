"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AdminNavbarProps {
  onMenuClick?: () => void;
}

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  const t = useTranslations();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface-container-low px-4">
      <div className="flex min-w-0 items-center gap-3 max-sm:gap-2">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label={t("common.toggleMenu")}
            className="lg:hidden"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <Logo href="/admin/dashboard" hideTextOnMobile />
        <span className="hidden shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline-flex">
          {t("adminChrome.admin")}
        </span>
      </div>

      <div className="relative flex shrink-0 items-center gap-2 max-sm:gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu profileHref="/admin/dashboard" />
      </div>
    </header>
  );
}