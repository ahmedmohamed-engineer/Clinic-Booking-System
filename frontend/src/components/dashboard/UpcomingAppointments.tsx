import Link from "next/link";
import { AppointmentCard } from "@/components/business/AppointmentCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AppointmentReadModel } from "@/types/models/appointment";

interface UpcomingAppointmentsProps {
  appointments: AppointmentReadModel[];
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}

export function UpcomingAppointments({
  appointments,
  onCancel,
  isCancelling,
}: UpcomingAppointmentsProps) {
  return (
    <section
      aria-labelledby="upcoming-heading"
      className="animate-fade-in flex flex-col gap-4"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/60">
          <h2 id="upcoming-heading" className="heading-2">
            Upcoming appointments
          </h2>
          <Link
            href="/appointments"
            className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={onCancel}
              isCancelling={isCancelling}
            />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}