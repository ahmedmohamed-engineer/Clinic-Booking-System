"use client";

import { useMemo, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePrefetchAdminSection } from "@/hooks/usePrefetchAdminSection";
import {
  Users,
  Building2,
  Stethoscope,
  UserRound,
  Clock,
  CalendarRange,
  Calendar,
  CreditCard,
  Star,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useAppointmentsAdmin } from "@/features/appointments";
import { useClinicsList } from "@/features/clinics";
import { usePaymentsAdmin } from "@/features/payments";
import { useUsersAdmin } from "@/features/users";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

const sections: {
  key:
    | "users"
    | "clinics"
    | "specialties"
    | "doctors"
    | "schedules"
    | "slots"
    | "appointments"
    | "payments"
    | "reviews"
    | "patients";
  href: string;
  icon: LucideIcon;
}[] = [
  {
    key: "users",
    href: "/admin/users",
    icon: Users,
  },
  {
    key: "clinics",
    href: "/admin/clinics",
    icon: Building2,
  },
  {
    key: "specialties",
    href: "/admin/specialties",
    icon: Stethoscope,
  },
  {
    key: "doctors",
    href: "/admin/doctors",
    icon: UserRound,
  },
  {
    key: "schedules",
    href: "/admin/doctor-schedules",
    icon: Clock,
  },
  {
    key: "slots",
    href: "/admin/appointment-slots",
    icon: CalendarRange,
  },
  {
    key: "appointments",
    href: "/admin/appointments",
    icon: Calendar,
  },
  {
    key: "payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    key: "reviews",
    href: "/admin/reviews",
    icon: Star,
  },
  {
    key: "patients",
    href: "/admin/patients",
    icon: ClipboardList,
  },
];

const toneDotClass: Record<string, string> = {
  success: "bg-status-success",
  info: "bg-status-info",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  neutral: "bg-status-neutral",
};

function BreakdownRow({
  label,
  tone,
  count,
}: {
  label: string;
  tone: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span
          className={`size-1.5 rounded-full ${toneDotClass[tone] ?? toneDotClass.neutral}`}
          aria-hidden="true"
        />
        {label}
      </span>
      <span className="font-semibold text-foreground tabular-nums">{count}</span>
    </div>
  );
}

function Breakdown({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-border/60 pt-3">
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  total,
  pending,
  error,
  href,
  children,
}: {
  icon: LucideIcon;
  label: string;
  total?: number;
  pending?: boolean;
  error?: boolean;
  href?: string;
  children?: ReactNode;
}) {
  const ta = useTranslations("admin");
  const body = pending ? (
    <Card>
      <CardContent>
        <Skeleton variant="card" className="h-24" />
      </CardContent>
    </Card>
  ) : (
    <Card className="h-full transition-colors group-hover:border-primary/50 group-focus-visible:border-primary/50">
      <CardContent className="flex flex-col gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <CardDescription>{label}</CardDescription>
          {error ? (
            <p className="text-xs text-muted-foreground">{ta("couldNotLoad")}</p>
          ) : (
            <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
              {total ?? 0}
            </CardTitle>
          )}
          {!error && children}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return body;

  return (
    <Link
      href={href}
      className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {body}
    </Link>
  );
}

function ActivityRow({
  leading,
  primary,
  secondary,
}: {
  leading: ReactNode;
  primary: string;
  secondary: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="shrink-0">{leading}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">{primary}</span>
        <span className="truncate text-xs text-muted-foreground">{secondary}</span>
      </div>
    </li>
  );
}

function ActivityGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

export default function AdminDashboardPage() {
  const ta = useTranslations("admin");
  const locale = useLocale();
  const prefetchSection = usePrefetchAdminSection();

  const { data: usersAll, isPending: usersPending, isError: usersError, refetch: refetchUsers } =
    useUsersAdmin({ limit: 1 });
  const { data: rolePatients, isPending: rolePatientsPending } = useUsersAdmin({
    limit: 1,
    role: "patient",
  });
  const { data: roleDoctors, isPending: roleDoctorsPending } = useUsersAdmin({
    limit: 1,
    role: "doctor",
  });
  const { data: roleAdmins, isPending: roleAdminsPending } = useUsersAdmin({
    limit: 1,
    role: "admin",
  });
  const { data: recentUsersData, isPending: recentUsersPending } = useUsersAdmin({ limit: 5 });

  const { data: clinics, isPending: clinicsPending, isError: clinicsError, refetch: refetchClinics } =
    useClinicsList();

  const {
    data: appointmentsData,
    isPending: appointmentsPending,
    isError: appointmentsError,
    refetch: refetchAppointments,
  } = useAppointmentsAdmin({});

  const {
    data: paymentsData,
    isPending: paymentsPending,
    isError: paymentsError,
    refetch: refetchPayments,
  } = usePaymentsAdmin({});

  const usersErrorAgg = usersError;
  const usersPendingAgg =
    usersPending || rolePatientsPending || roleDoctorsPending || roleAdminsPending;

  const overviewPending =
    usersPendingAgg || clinicsPending || appointmentsPending || paymentsPending;
  const overviewError =
    usersErrorAgg || clinicsError || appointmentsError || paymentsError;

  const appointments = useMemo(() => appointmentsData?.data ?? [], [appointmentsData]);
  const payments = useMemo(() => paymentsData?.data ?? [], [paymentsData]);

  const appointmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const appointment of appointments) {
      counts[appointment.status] = (counts[appointment.status] ?? 0) + 1;
    }
    return counts;
  }, [appointments]);

  const paymentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const payment of payments) {
      counts[payment.status] = (counts[payment.status] ?? 0) + 1;
    }
    return counts;
  }, [payments]);

  const recentUsers = useMemo(
    () =>
      [...(recentUsersData?.data ?? [])]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [recentUsersData],
  );

  const upcomingVisits = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === "scheduled" || appointment.status === "confirmed",
        )
        .sort((a, b) => `${a.slot.date}T${a.slot.startTime}`.localeCompare(
          `${b.slot.date}T${b.slot.startTime}`,
        ))
        .slice(0, 3),
    [appointments],
  );

  const latestPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) =>
          `${b.slot.date}T${b.slot.startTime}`.localeCompare(
            `${a.slot.date}T${a.slot.startTime}`,
          ),
        )
        .slice(0, 3),
    [payments],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{ta("headerTitle")}</h1>
        <p className="text-lg text-muted-foreground">
          {ta("headerSubtitle")}
        </p>
      </header>

      {overviewError && !overviewPending && (
        <ErrorBanner
          message={ta("errorOverview")}
          onRetry={() => {
            refetchUsers();
            refetchClinics();
            refetchAppointments();
            refetchPayments();
          }}
        />
      )}

      <section aria-labelledby="overview-heading" className="flex flex-col gap-4">
        <h2 id="overview-heading" className="heading-2">
          {ta("overview")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label={ta("totalUsers")}
            total={usersAll?.pagination?.total}
            pending={usersPendingAgg}
            error={usersErrorAgg}
            href="/admin/users"
          >
            <Breakdown>
              <BreakdownRow
                label={ta("breakdown.patients")}
                tone="info"
                count={rolePatients?.pagination?.total ?? 0}
              />
              <BreakdownRow
                label={ta("breakdown.doctors")}
                tone="success"
                count={roleDoctors?.pagination?.total ?? 0}
              />
              <BreakdownRow
                label={ta("breakdown.admins")}
                tone="neutral"
                count={roleAdmins?.pagination?.total ?? 0}
              />
            </Breakdown>
          </StatCard>

          <StatCard
            icon={Building2}
            label={ta("totalClinics")}
            total={clinics?.length}
            pending={clinicsPending}
            error={clinicsError}
            href="/admin/clinics"
          />

          <StatCard
            icon={Calendar}
            label={ta("totalAppointments")}
            total={appointments.length}
            pending={appointmentsPending}
            error={appointmentsError}
            href="/admin/appointments"
          >
            <Breakdown>
              <BreakdownRow
                label={ta("breakdown.scheduled")}
                tone="info"
                count={appointmentCounts.scheduled ?? 0}
              />
              <BreakdownRow
                label={ta("breakdown.confirmed")}
                tone="info"
                count={appointmentCounts.confirmed ?? 0}
              />
              <BreakdownRow
                label={ta("breakdown.completed")}
                tone="success"
                count={appointmentCounts.completed ?? 0}
              />
              <BreakdownRow
                label={ta("breakdown.cancelled")}
                tone="danger"
                count={appointmentCounts.cancelled ?? 0}
              />
              <BreakdownRow
                label={ta("breakdown.noShow")}
                tone="neutral"
                count={appointmentCounts.no_show ?? 0}
              />
            </Breakdown>
          </StatCard>

          <StatCard
            icon={CreditCard}
            label={ta("totalPayments")}
            total={payments.length}
            pending={paymentsPending}
            error={paymentsError}
            href="/admin/payments"
          >
            <Breakdown>
              <BreakdownRow label={ta("breakdown.paid")} tone="success" count={paymentCounts.paid ?? 0} />
              <BreakdownRow label={ta("breakdown.pending")} tone="warning" count={paymentCounts.pending ?? 0} />
              <BreakdownRow label={ta("breakdown.failed")} tone="danger" count={paymentCounts.failed ?? 0} />
              <BreakdownRow label={ta("breakdown.refunded")} tone="neutral" count={paymentCounts.refunded ?? 0} />
            </Breakdown>
          </StatCard>
        </div>
      </section>

      <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
        <h2 id="activity-heading" className="heading-2">
          {ta("recentActivity")}
        </h2>
        <Card>
          <CardContent>
            {overviewPending ? (
              <div className="flex flex-col gap-6">
                <Skeleton variant="card" className="h-28" />
                <Skeleton variant="card" className="h-28" />
              </div>
            ) : (
              <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                <ActivityGroup
                  label={
                    recentUsersPending
                      ? ta("newUsers")
                      : ta("newUsersCount", { count: recentUsers.length })
                  }
                >
                  {recentUsers.map((user) => (
                    <ActivityRow
                      key={user.id}
                      leading={
                        <Avatar
                          src={user.avatarUrl}
                          fallback={user.fullName ?? user.email}
                          className="size-9 shrink-0"
                          width={36}
                          height={36}
                        />
                      }
                      primary={user.fullName ?? user.email}
                      secondary={ta("activitySecondaryNoTime", {
                        name: ta(`roles.${user.role}`),
                        date: formatDate(user.createdAt, locale),
                      })}
                    />
                  ))}
                </ActivityGroup>

                <ActivityGroup
                  label={
                    appointmentsPending
                      ? ta("upcomingVisits")
                      : ta("upcomingVisitsCount", { count: upcomingVisits.length })
                  }
                >
                  {upcomingVisits.map((appointment) => (
                    <ActivityRow
                      key={appointment.id}
                      leading={
                        <Avatar
                          src={appointment.patient.avatarUrl}
                          fallback={appointment.patient.fullName}
                          className="size-9 shrink-0"
                          width={36}
                          height={36}
                        />
                      }
                      primary={appointment.patient.fullName}
                      secondary={ta("upcomingVisit", {
                        name: appointment.doctor.displayName,
                        date: formatDate(appointment.slot.date, locale),
                        time: formatTime(appointment.slot.startTime, locale),
                      })}
                    />
                  ))}
                </ActivityGroup>

                <ActivityGroup
                  label={
                    paymentsPending
                      ? ta("latestPayments")
                      : ta("latestPaymentsCount", { count: latestPayments.length })
                  }
                >
                  {latestPayments.map((payment) => (
                    <ActivityRow
                      key={payment.id}
                      leading={
                        <Avatar
                          src={payment.patient.avatarUrl}
                          fallback={payment.patient.fullName}
                          className="size-9 shrink-0"
                          width={36}
                          height={36}
                        />
                      }
                      primary={payment.patient.fullName}
                      secondary={ta("paymentActivity", {
                        amount: formatCurrency(payment.amount, locale),
                        method: ta(`payMethods.${payment.method}`),
                        status: ta(`breakdown.${payment.status}`),
                      })}
                    />
                  ))}
                </ActivityGroup>

                {recentUsers.length === 0 &&
                  upcomingVisits.length === 0 &&
                  latestPayments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {ta("noActivity")}
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="sections-heading">
        <div className="flex flex-col gap-4">
          <h2 id="sections-heading" className="heading-2">
            {ta("manage")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  onMouseEnter={() => prefetchSection(section.href)}
                  onFocus={() => prefetchSection(section.href)}
                  className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <Card className="h-full transition-colors group-hover:border-primary/50 group-focus-visible:border-primary/50">
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <CardTitle>{ta(`sections.${section.key}.label`)}</CardTitle>
                        <CardDescription>{ta(`sections.${section.key}.description`)}</CardDescription>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}