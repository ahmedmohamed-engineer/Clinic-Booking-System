"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";

interface AdminNavbarProps {
  onMenuClick?: () => void;
}

export function AdminNavbar({ onMenuClick }: AdminNavbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface-container-low px-4">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="md:hidden"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <Link href="/admin/dashboard" className="text-lg font-bold text-primary">
          HealthFlow
        </Link>
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        <UserMenu profileHref="/admin/dashboard" />
      </div>
    </header>
  );
}