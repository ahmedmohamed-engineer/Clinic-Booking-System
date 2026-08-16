"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  CreditCard,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePrefetchBookingData } from "@/hooks/usePrefetchBookingData";
import { cn, isPathActive } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const patientLinks: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/appointments", icon: Calendar },
  { label: "Book Appointment", href: "/book", icon: CalendarPlus },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Profile", href: "/profile", icon: User },
];

const doctorLinks: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/appointments", icon: Calendar },
  { label: "Schedule", href: "/schedule", icon: CalendarPlus },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Profile", href: "/profile", icon: User },
];

export function RoleBasedSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const prefetchBooking = usePrefetchBookingData();

  const links = user?.role === "doctor" ? doctorLinks : patientLinks;

  return (
    <nav className={cn("flex flex-col gap-1 p-4", className)}>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = isPathActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            onMouseEnter={link.href === "/book" ? prefetchBooking : undefined}
            onFocus={link.href === "/book" ? prefetchBooking : undefined}
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
