import type { ReactNode } from "react";
import { AuthGuardWrapper } from "./auth-guard-wrapper";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuardWrapper>
      <AppLayout>{children}</AppLayout>
    </AuthGuardWrapper>
  );
}
