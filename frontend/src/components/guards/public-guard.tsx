"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, type ReactNode } from "react";
import { getHomePathForRole } from "@/lib/routing";

interface PublicGuardProps {
  children: ReactNode;
  selfManagedRedirectPaths?: string[];
}

export function PublicGuard({
  children,
  selfManagedRedirectPaths = [],
}: PublicGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const selfManagesRedirect = selfManagedRedirectPaths.some((path) => pathname === path);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !selfManagesRedirect) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [isAuthenticated, isLoading, router, selfManagesRedirect, user]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated && !selfManagesRedirect) {
    return null;
  }

  return <>{children}</>;
}