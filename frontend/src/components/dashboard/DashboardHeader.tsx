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
    <header className="animate-fade-in flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="flex flex-col gap-1">
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