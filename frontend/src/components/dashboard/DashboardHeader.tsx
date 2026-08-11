import type { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  name?: string;
  subtitle?: string;
  action?: ReactNode;
  avatar?: ReactNode;
}

export function DashboardHeader({ title, name, subtitle, action, avatar }: DashboardHeaderProps) {
  return (
    <header className="animate-fade-in flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="heading-1">
              {name ? `${title}, ${name}` : title}
            </h1>
            {subtitle && <p className="body-text">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}