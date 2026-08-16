"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Stethoscope,
  Clock,
  CalendarRange,
  Calendar,
  CreditCard,
  Star,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn, isPathActive } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

const adminLinks: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Clinics", href: "/admin/clinics", icon: Building2 },
  { label: "Specialties", href: "/admin/specialties", icon: Stethoscope },
  { label: "Doctors", href: "/admin/doctors", icon: UserRound },
  { label: "Schedules", href: "/admin/doctor-schedules", icon: Clock },
  { label: "Slots", href: "/admin/appointment-slots", icon: CalendarRange },
  { label: "Appointments", href: "/admin/appointments", icon: Calendar },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Patients", href: "/admin/patients", icon: Users },
];

export function AdminSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 overflow-y-auto p-4", className)}>
      {adminLinks.map((link) => {
        const Icon = link.icon;
        const isActive = isPathActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {isActive && (
              <BiroCircle
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
            )}
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
