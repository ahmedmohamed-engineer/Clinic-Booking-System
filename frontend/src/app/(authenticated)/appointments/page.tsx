"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
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
        <ErrorBanner message="Could not load your appointments." onRetry={refetch} />
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
          <h1 className="heading-1">Appointments</h1>
          <p className="body-text">View and manage all of your appointments.</p>
        </div>
        <Link
          href="/book"
          onMouseEnter={prefetchBooking}
          onFocus={prefetchBooking}
        >
          <Button>
            <CalendarPlus />
            Book Appointment
          </Button>
        </Link>
      </header>

      <div className="animate-fade-in">
      {empty ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarDays className="size-12" />}
            title="No appointments yet"
            description="Book your first appointment to get started."
            action={
              <Link
                href="/book"
                onMouseEnter={prefetchBooking}
                onFocus={prefetchBooking}
              >
                <Button>
                  <CalendarPlus />
                  Book Appointment
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-12" />}
                title="No upcoming appointments"
                description="When you book an appointment, it will appear here."
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
                title="No past appointments"
                description="Completed and cancelled appointments will appear here."
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
        <ErrorBanner message="Could not load your appointments." onRetry={refetch} />
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
        <h1 className="heading-1">Appointments</h1>
        <p className="body-text">Appointments booked by your patients.</p>
      </header>

      <div className="animate-fade-in">
      {empty ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarDays className="size-12" />}
            title="No appointments"
            description="When patients book appointments, they will appear here."
          />
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-12" />}
                title="No upcoming appointments"
                description="Appointments scheduled for your patients will appear here."
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
                title="No past appointments"
                description="Completed and cancelled appointments will appear here."
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
