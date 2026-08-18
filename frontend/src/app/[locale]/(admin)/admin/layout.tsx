import type { ReactNode } from "react";
import { AdminGuardWrapper } from "./admin-guard-wrapper";
import { AdminLayoutShell } from "@/components/layout/AdminLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuardWrapper>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminGuardWrapper>
  );
}
