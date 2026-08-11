"use client";

import { useState, type ReactNode } from "react";
import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";
import { Sheet } from "@/components/ui/sheet";

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <aside className="hidden w-60 flex-shrink-0 border-r border-border bg-surface-container-low lg:block">
          <AdminSidebar />
        </aside>
        <Sheet open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left">
          <div className="pt-2">
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </Sheet>
        <main className="flex min-w-0 flex-1 flex-col overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
