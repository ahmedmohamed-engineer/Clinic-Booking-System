import type { ReactNode } from "react";
import { AuthGuardWrapper } from "../auth-guard-wrapper";

export default function BookLayout({ children }: { children: ReactNode }) {
  return <AuthGuardWrapper allowedRoles={["patient"]}>{children}</AuthGuardWrapper>;
}
