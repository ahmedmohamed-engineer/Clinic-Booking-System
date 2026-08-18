import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("upcoming");

  return (
    <section
      aria-labelledby="upcoming-heading"
      className="animate-fade-in flex flex-col gap-4"
    >
      <Card>
        <CardHeader className="flex flex-col gap-2 border-b border-border/60 md:flex-row md:items-center md:justify-between">
          <h2 id="upcoming-heading" className="heading-2">
            {t("title")}
          </h2>
          <Link
            href="/appointments"
            className="w-fit text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
          >
            {t("viewAll")}
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