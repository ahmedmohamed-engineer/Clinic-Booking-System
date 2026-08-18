"use client";

import type { ReactNode } from "react";
import { AdminGuard } from "@/components/guards/admin-guard";

export function AdminGuardWrapper({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
