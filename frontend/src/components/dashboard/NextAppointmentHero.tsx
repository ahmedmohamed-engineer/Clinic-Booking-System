import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, CalendarCheck, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/business/StatusBadge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import type { AppointmentReadModel } from "@/types/models/appointment";

interface NextAppointmentHeroProps {
  appointment: AppointmentReadModel;
  action?: ReactNode;
}

export function NextAppointmentHero({ appointment, action }: NextAppointmentHeroProps) {
  const detailsHref = `/appointments/${appointment.id}`;

  return (
    <Card className="animate-fade-in overflow-hidden border-t-4 border-t-primary">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 id="next-appointment-heading" className="heading-2">
              Your next appointment
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {formatDate(appointment.slot.date)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-medium text-muted-foreground">
              <Clock className="size-4" aria-hidden="true" />
              {formatTime(appointment.slot.startTime)} –{" "}
              {formatTime(appointment.slot.endTime)}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <dl className="grid grid-cols-1 gap-3 border-t border-border/60 pt-6 text-sm md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Avatar
              src={appointment.doctor.avatarUrl}
              fallback={appointment.doctor.displayName}
              className="mt-0.5 size-9 shrink-0"
              width={40}
              height={40}
            />
            <div>
              <dt className="text-xs text-muted-foreground">Doctor</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {appointment.doctor.displayName} · {appointment.doctor.specialtyName}
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

      <CardFooter className="relative flex flex-col items-stretch gap-3 border-t border-border/60 md:flex-row md:flex-wrap md:items-center">
        <Link href={detailsHref} className="inline-flex w-full md:w-auto">
          <Button variant="outline" className="w-full md:w-auto">
            <CalendarCheck />
            View details
          </Button>
        </Link>
        {action}
      </CardFooter>
    </Card>
  );
}
