import type { ReactNode } from "react";
import { AuthGuardWrapper } from "../auth-guard-wrapper";

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return <AuthGuardWrapper allowedRoles={["patient"]}>{children}</AuthGuardWrapper>;
}
