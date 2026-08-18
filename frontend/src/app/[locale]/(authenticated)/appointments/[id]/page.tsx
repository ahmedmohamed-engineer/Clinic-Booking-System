"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Clock, Stethoscope, User } from "lucide-react";
import { useMemo } from "react";
import { useMyAppointments } from "@/features/appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatDate, formatTime } from "@/lib/utils";

export default function AppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: appointments, isPending } = useMyAppointments();

  const appointment = useMemo(
    () => appointments?.find((a) => a.id === id),
    [appointments, id],
  );

  let content;

  if (isPending) {
    content = (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="card" className="h-52" />
      </div>
    );
  } else if (!appointment) {
    content = (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Stethoscope className="size-12" />}
            title="Appointment not found"
            description="This appointment does not exist or is no longer available."
            action={
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft />
                  Back to dashboard
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="heading-1">Appointment details</h1>
          <p className="body-text">A summary of your upcoming appointment.</p>
        </div>

        <Card className="animate-fade-in overflow-hidden border-t-4 border-t-primary">
          <CardContent className="flex flex-col gap-6">
              <div>
                <h2 id="appointment-detail-heading" className="heading-2">
                  Your appointment
                </h2>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {formatDate(appointment.slot.date)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-medium text-muted-foreground">
                  <Clock className="size-4" aria-hidden="true" />
                  {formatTime(appointment.slot.startTime)} –{" "}
                  {formatTime(appointment.slot.endTime)}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 border-t border-border/60 pt-6 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-xs text-muted-foreground">Doctor</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {appointment.doctor.displayName} ·{" "}
                    {appointment.doctor.specialtyName}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <dt className="text-xs text-muted-foreground">Clinic</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {appointment.doctor.clinicName}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-custom flex flex-col gap-8 p-6">{content}</div>
  );
}