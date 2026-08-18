"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/guards/auth-guard";
import type { UserRole } from "@/types/enums";

interface AuthGuardWrapperProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuardWrapper({ children, allowedRoles }: AuthGuardWrapperProps) {
  return <AuthGuard allowedRoles={allowedRoles}>{children}</AuthGuard>;
}
