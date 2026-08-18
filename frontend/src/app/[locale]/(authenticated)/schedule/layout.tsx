import type { ReactNode } from "react";
import { AuthGuardWrapper } from "../auth-guard-wrapper";

export default function ScheduleLayout({ children }: { children: ReactNode }) {
  return <AuthGuardWrapper allowedRoles={["doctor"]}>{children}</AuthGuardWrapper>;
}
