"use client";

import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarPlus,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMyAppointments, useCancelAppointment } from "@/features/appointments";
import { usePatientProfile } from "@/features/patients";

import { useMySchedule } from "@/features/schedules";
import { usePrefetchBookingData } from "@/hooks/usePrefetchBookingData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NextAppointmentHero } from "@/components/dashboard/NextAppointmentHero";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { AppointmentCard } from "@/components/business/AppointmentCard";
import { ProfileSummaryCard } from "@/components/business/ProfileSummaryCard";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/feedback/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { Button } from "@/components/ui/button";
import { resolveDisplayName, toISODateString } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/enums";

const WeeklyCalendar = dynamic(
  () => import("@/components/business/WeeklyCalendar").then((mod) => mod.WeeklyCalendar),
  { loading: () => <Skeleton variant="calendar" /> },
);

const UPCOMING_STATUSES = new Set<AppointmentStatus>([
  "scheduled",
  "confirmed",
]);

interface DashboardStat {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}

function DashboardStats({
  stats,
  loading,
}: {
  stats: DashboardStat[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} variant="card" className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map(({ icon: Icon, label, value, hint, href }) => {
        const content = (
          <Card className="h-full transition-colors group-hover:border-primary/50 group-focus-visible:border-primary/50">
            <CardContent className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
                {hint && (
                  <p className="text-xs text-muted-foreground">{hint}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );

        return href ? (
          <Link
            key={label}
            href={href}
            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {content}
          </Link>
        ) : (
          <div key={label}>{content}</div>
        );
      })}
    </div>
  );
}

function PatientDashboardContent() {
  const { user } = useAuth();
  const { data: appointments, isPending, isError, refetch } = useMyAppointments();
  const { data: patient, isPending: isProfilePending } = usePatientProfile();
  const { mutate: cancelAppointment, isPending: isCancelling } =
    useCancelAppointment();
  const prefetchBooking = usePrefetchBookingData();

  useEffect(() => {
    prefetchBooking();
  }, [prefetchBooking]);

  const upcoming = useMemo(
    () =>
      appointments?.filter((appointment) =>
        UPCOMING_STATUSES.has(appointment.status),
      ) ?? [],
    [appointments],
  );

  const nextAppointment = useMemo(() => {
    if (upcoming.length === 0) return null;
    return [...upcoming].sort((a, b) =>
      `${a.slot.date}T${a.slot.startTime}`.localeCompare(
        `${b.slot.date}T${b.slot.startTime}`,
      ),
    )[0];
  }, [upcoming]);

  const otherUpcoming = useMemo(
    () =>
      nextAppointment
        ? upcoming.filter((appointment) => appointment.id !== nextAppointment.id)
        : [],
    [upcoming, nextAppointment],
  );

  const handleCancel = useCallback(
    (id: string) => cancelAppointment(id),
    [cancelAppointment],
  );

  const hero =
    nextAppointment ? (
      <NextAppointmentHero
        appointment={nextAppointment}
        action={
          <>
            <Link
              href="/book"
              className="inline-flex w-full md:w-auto"
              onMouseEnter={prefetchBooking}
              onFocus={prefetchBooking}
            >
              <Button className="w-full md:w-auto">
                <CalendarPlus />
                Book Appointment
              </Button>
            </Link>
            <Link
              href="/appointments"
              className="inline-flex w-full md:w-auto"
            >
              <Button variant="outline" className="w-full md:w-auto">
                View Appointments
              </Button>
            </Link>
          </>
        }
      />
    ) : (
      <EmptyDashboardState
        action={
          <Link
            href="/book"
            className="inline-flex w-full md:w-auto"
            onMouseEnter={prefetchBooking}
            onFocus={prefetchBooking}
          >
            <Button size="lg" className="w-full md:w-auto">
              <CalendarPlus />
              Book Appointment
            </Button>
          </Link>
        }
      />
    );

  return (
    <div className="container-custom flex flex-col gap-8 p-6">
      <DashboardHeader
        title="Welcome back"
        subtitle="Your care at a glance."
        name={resolveDisplayName(
          [patient?.fullName, user?.fullName],
          user?.email,
          "Patient",
        )}
        avatar={
          <Avatar
            src={patient?.avatarUrl ?? user?.avatarUrl}
            fallback={resolveDisplayName(
              [patient?.fullName, user?.fullName],
              user?.email,
              "Patient",
            )}
            className="size-10"
            width={40}
            height={40}
          />
        }
      />

      {isError ? (
        <ErrorBanner message="Unable to load your appointments." onRetry={refetch} />
      ) : isPending ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            {hero}
            {otherUpcoming.length > 0 && (
              <UpcomingAppointments
                appointments={otherUpcoming}
                onCancel={handleCancel}
                isCancelling={isCancelling}
              />
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-6 lg:col-span-4">
            <QuickActions />
            <section aria-labelledby="health-summary-heading" className="animate-fade-in flex flex-col gap-4">
              <h2 id="health-summary-heading" className="heading-2">
                Health summary
              </h2>
              {isProfilePending ? (
                <Skeleton variant="card" className="h-48" />
              ) : patient ? (
                <ProfileSummaryCard patient={patient} email={user?.email} />
              ) : (
                <div className="rounded-xl border border-border bg-card">
                  <EmptyState
                    icon={<UserRound className="size-12" />}
                    title="Complete your profile"
                    description="Add your contact details so your clinic can reach you."
                    action={
                      <Link href="/profile">
                        <Button>Complete Profile</Button>
                      </Link>
                    }
                  />
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function DoctorDashboardContent() {
  const { user } = useAuth();
  const { data: appointments, isPending, isError, refetch } = useMyAppointments();
  const {
    data: schedules,
    isPending: isSchedulePending,
    isError: isScheduleError,
    refetch: refetchSchedule,
  } = useMySchedule();
  const { mutate: cancelAppointment, isPending: isCancelling } =
    useCancelAppointment();

  const upcoming = useMemo(
    () =>
      appointments?.filter((appointment) =>
        UPCOMING_STATUSES.has(appointment.status),
      ) ?? [],
    [appointments],
  );
  const handleCancel = useCallback(
    (id: string) => cancelAppointment(id),
    [cancelAppointment],
  );

  const todayStr = toISODateString(new Date());
  const todayCount = useMemo(
    () =>
      appointments?.filter((appointment) => appointment.slot.date === todayStr)
        .length ?? 0,
    [appointments, todayStr],
  );
  const workingDays = useMemo(
    () => new Set(schedules?.map((schedule) => schedule.weekday) ?? []).size,
    [schedules],
  );

  const stats: DashboardStat[] = useMemo(
    () => [
      {
        icon: CalendarClock,
        label: "Appointments Today",
        value: todayCount,
        href: "/appointments",
        hint: "On your calendar today",
      },
      {
        icon: CalendarDays,
        label: "Upcoming Appointments",
        value: upcoming.length,
        href: "/appointments",
        hint: "Scheduled & confirmed",
      },
      {
        icon: CalendarRange,
        label: "Working Days",
        value: workingDays,
        href: "/schedule",
        hint: "Days in your weekly schedule",
      },
    ],
    [todayCount, upcoming.length, workingDays],
  );

  return (
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.avatarUrl}
            fallback={resolveDisplayName(
              [user?.fullName],
              user?.email,
              "Doctor",
            )}
            className="size-10"
            width={40}
            height={40}
          />
          <div className="flex flex-col gap-1">
            <h1 className="heading-1">Doctor Dashboard</h1>
            <p className="body-text">
              Here is an overview of your appointments and weekly schedule.
            </p>
          </div>
        </div>
      </header>

      {isError || isScheduleError ? (
        <ErrorBanner
          message="Could not load your dashboard data."
          onRetry={() => {
            refetch();
            refetchSchedule();
          }}
        />
      ) : (
        <DashboardStats stats={stats} loading={isPending || isSchedulePending} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="animate-fade-in flex flex-col gap-4 lg:col-span-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 id="upcoming-heading" className="heading-2">
              Upcoming Appointments
            </h2>
            <Link
              href="/appointments"
              className="w-fit text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
            >
              View All
            </Link>
          </div>

          {isError && (
            <ErrorBanner
              message="Could not load your appointments."
              onRetry={refetch}
            />
          )}

          {isPending ? (
            <div className="space-y-3">
              <Skeleton variant="card" className="h-20" />
              <Skeleton variant="card" className="h-20" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState
                icon={<CalendarDays className="size-12" />}
                title="No appointments scheduled"
                description="Appointments booked by your patients will appear here."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={handleCancel}
                  isCancelling={isCancelling}
                  viewer="doctor"
                />
              ))}
            </div>
          )}
        </section>

        <section className="animate-fade-in flex flex-col gap-4 lg:col-span-4">
          <h2 id="weekly-schedule-heading" className="heading-2">Weekly Schedule</h2>
          {isSchedulePending ? (
            <Skeleton variant="card" className="h-48" />
          ) : isScheduleError ? (
            <ErrorBanner
              message="Could not load your schedule."
              onRetry={refetchSchedule}
            />
          ) : (schedules?.length ?? 0) === 0 ? (
<div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={<CalendarClock className="size-12" />}
              title="No schedule defined"
              description="Set your weekly availability so patients can book you."
              action={
                <Link href="/schedule">
                  <Button variant="outline" size="sm">
                    Set up your schedule
                  </Button>
                </Link>
              }
            />
          </div>
          ) : (
            <WeeklyCalendar schedules={schedules ?? []} />
          )}
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return user?.role === "doctor" ? (
    <DoctorDashboardContent />
  ) : (
    <PatientDashboardContent />
  );
}