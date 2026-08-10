import Link from "next/link";
import { CalendarPlus, CalendarDays, ChevronRight, CreditCard, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickAction {
  label: string;
  href: string;
  icon: typeof CalendarPlus;
}

const actions: QuickAction[] = [
  { label: "Book Appointment", href: "/book", icon: CalendarPlus },
  { label: "View Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Leave a Review", href: "/reviews", icon: Star },
];

export function QuickActions() {
  return (
    <Card className="animate-fade-in">
      <div className="border-b border-border/60 px-(--card-spacing) py-(--card-spacing)">
        <h2 id="quick-actions-heading" className="heading-2">
          Quick actions
        </h2>
      </div>
      <CardContent className="flex flex-col p-(--card-spacing)">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
            <ChevronRight
              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}