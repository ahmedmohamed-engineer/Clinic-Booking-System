"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/types/enums";
import { getHomePathForRole } from "@/lib/routing";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
      router.replace(getHomePathForRole(user.role as UserRole));
    }
  }, [isAuthenticated, isLoading, router, pathname, user, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    return null;
  }

  return <>{children}</>;
}
