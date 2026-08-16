"use client";

import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="lg:hidden"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <Logo />
      </div>

      <div className="relative flex items-center gap-2">
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <Button variant="default" size="sm" onClick={() => router.push("/login")}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}