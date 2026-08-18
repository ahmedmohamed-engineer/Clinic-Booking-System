"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { isAuthenticated } = useAuth();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
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
        <Logo />
      </div>

      <div className="relative flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <Button
            variant="default"
            size="sm"
            render={<Link href="/login" />}
          >
            {t("common.signIn")}
          </Button>
        )}
      </div>
    </header>
  );
}