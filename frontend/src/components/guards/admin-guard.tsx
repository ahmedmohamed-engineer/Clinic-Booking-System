"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";
import { useEffect, type ReactNode } from "react";
import { getHomePathForRole } from "@/lib/routing";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "admin") {
      router.replace(getHomePathForRole(user?.role ?? "patient"));
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
