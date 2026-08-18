"use client";

import { useCallback, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { CalendarPlus, CalendarDays, Inbox } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMyAppointments, useCancelAppointment } from "@/features/appointments";
import { usePrefetchBookingData } from "@/hooks/usePrefetchBookingData";
import { AppointmentCard } from "@/components/business/AppointmentCard";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppointmentStatus } from "@/types/enums";

const UPCOMING_STATUSES = new Set<AppointmentStatus>(["scheduled", "confirmed"]);
const PAST_STATUSES = new Set<AppointmentStatus>([
  "completed",
  "cancelled",
  "no_show",
]);

function PatientAppointmentsContent() {
  const t = useTranslations("appointmentsPage");
  const { data: appointments, isPending, isError, refetch } = useMyAppointments();
  const { mutate: cancelAppointment, isPending: isCancelling } =
    useCancelAppointment();
  const prefetchBooking = usePrefetchBookingData();

  const upcoming = useMemo(
    () =>
      appointments?.filter((appointment) =>
        UPCOMING_STATUSES.has(appointment.status),
      ) ?? [],
    [appointments],
  );
  const past = useMemo(
    () =>
      appointments?.filter((appointment) =>
        PAST_STATUSES.has(appointment.status),
      ) ?? [],
    [appointments],
  );
  const handleCancel = useCallback(
    (id: string) => cancelAppointment(id),
    [cancelAppointment],
  );

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message={t("error")} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  const empty = appointments?.length === 0;

  return (
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="heading-1">{t("title")}</h1>
          <p className="body-text">{t("patientSubtitle")}</p>
        </div>
        <Link
          href="/book"
          className="inline-flex w-full md:w-auto"
          onMouseEnter={prefetchBooking}
          onFocus={prefetchBooking}
        >
          <Button className="w-full md:w-auto">
            <CalendarPlus />
            {t("book")}
          </Button>
        </Link>
      </header>

      <div className="animate-fade-in">
      {empty ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarDays className="size-12" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
            action={
              <Link
                href="/book"
                className="inline-flex w-full md:w-auto"
                onMouseEnter={prefetchBooking}
                onFocus={prefetchBooking}
              >
                <Button className="w-full md:w-auto">
                  <CalendarPlus />
                  {t("book")}
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming">
              {t("upcomingTab", { count: upcoming.length })}
            </TabsTrigger>
            <TabsTrigger value="past">{t("pastTab", { count: past.length })}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-12" />}
                title={t("noUpcomingTitle")}
                description={t("noUpcomingPatientDesc")}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                    isCancelling={isCancelling}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {past.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-12" />}
                title={t("noPastTitle")}
                description={t("noPastDesc")}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {past.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      </div>
    </div>
  );
}

function DoctorAppointmentsContent() {
  const t = useTranslations("appointmentsPage");
  const { data: appointments, isPending, isError, refetch } = useMyAppointments();
  const { mutate: cancelAppointment, isPending: isCancelling } =
    useCancelAppointment();

  const upcoming = useMemo(
    () =>
      appointments?.filter((appointment) =>
        UPCOMING_STATUSES.has(appointment.status),
      ) ?? [],
    [appointments],
  );
  const past = useMemo(
    () =>
      appointments?.filter((appointment) =>
        PAST_STATUSES.has(appointment.status),
      ) ?? [],
    [appointments],
  );
  const handleCancel = useCallback(
    (id: string) => cancelAppointment(id),
    [cancelAppointment],
  );

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message={t("error")} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  const empty = appointments?.length === 0;

  return (
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-2">
        <h1 className="heading-1">{t("title")}</h1>
        <p className="body-text">{t("doctorSubtitle")}</p>
      </header>

      <div className="animate-fade-in">
      {empty ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarDays className="size-12" />}
            title={t("emptyDoctorTitle")}
            description={t("emptyDoctorDesc")}
          />
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming">
              {t("upcomingTab", { count: upcoming.length })}
            </TabsTrigger>
            <TabsTrigger value="past">{t("pastTab", { count: past.length })}</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-12" />}
                title={t("noUpcomingTitle")}
                description={t("noUpcomingDoctorDesc")}
              />
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
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {past.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-12" />}
                title={t("noPastTitle")}
                description={t("noPastDesc")}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {past.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} viewer="doctor" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { user } = useAuth();

  return user?.role === "doctor" ? (
    <DoctorAppointmentsContent />
  ) : (
    <PatientAppointmentsContent />
  );
}
