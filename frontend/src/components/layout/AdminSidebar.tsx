"use client";

import { Link, usePathname } from "@/i18n/navigation";
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
import { useTranslations } from "next-intl";
import { cn, isPathActive } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

export function AdminSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations();

  const adminLinks: { label: string; href: string; icon: LucideIcon }[] = [
    { label: t("adminChrome.dashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
    { label: t("adminChrome.users"), href: "/admin/users", icon: Users },
    { label: t("adminChrome.clinics"), href: "/admin/clinics", icon: Building2 },
    { label: t("adminChrome.specialties"), href: "/admin/specialties", icon: Stethoscope },
    { label: t("adminChrome.doctors"), href: "/admin/doctors", icon: UserRound },
    { label: t("adminChrome.schedules"), href: "/admin/doctor-schedules", icon: Clock },
    { label: t("adminChrome.slots"), href: "/admin/appointment-slots", icon: CalendarRange },
    { label: t("adminChrome.appointments"), href: "/admin/appointments", icon: Calendar },
    { label: t("adminChrome.payments"), href: "/admin/payments", icon: CreditCard },
    { label: t("adminChrome.reviews"), href: "/admin/reviews", icon: Star },
    { label: t("adminChrome.patients"), href: "/admin/patients", icon: Users },
  ];

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