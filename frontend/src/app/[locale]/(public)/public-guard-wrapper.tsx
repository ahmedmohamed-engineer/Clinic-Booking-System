"use client";

import type { ReactNode } from "react";
import { PublicGuard } from "@/components/guards/public-guard";

interface PublicGuardWrapperProps {
  children: ReactNode;
  selfManagedRedirectPaths?: string[];
}

export function PublicGuardWrapper({
  children,
  selfManagedRedirectPaths,
}: PublicGuardWrapperProps) {
  return (
    <PublicGuard selfManagedRedirectPaths={selfManagedRedirectPaths}>
      {children}
    </PublicGuard>
  );
}
