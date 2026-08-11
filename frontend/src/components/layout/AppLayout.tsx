"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { RoleBasedSidebar } from "./RoleBasedSidebar";
import { Sheet } from "@/components/ui/sheet";

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <aside className="hidden w-60 flex-shrink-0 border-r border-border bg-surface-container-low lg:block">
          <RoleBasedSidebar />
        </aside>
        <Sheet open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left">
          <div className="pt-2">
            <RoleBasedSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </Sheet>
        <main className="flex min-w-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </div>
  );
}
