import type { ReactNode } from "react";
import { CalendarPlus } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";

interface EmptyDashboardStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyDashboardState({
  title = "No upcoming appointments",
  description = "You're all set for now. Book a visit whenever you're ready.",
  action,
}: EmptyDashboardStateProps) {
  return (
    <section className="animate-fade-in rounded-xl border border-border bg-card">
      <EmptyState
        icon={<CalendarPlus className="size-12" />}
        title={title}
        description={description}
        action={action}
      />
    </section>
  );
}