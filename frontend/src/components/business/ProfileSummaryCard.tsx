import { CalendarDays, Phone, User as UserIcon, VenusAndMars } from "lucide-react";
import { formatDate, resolveDisplayName } from "@/lib/utils";
import type { PatientRecord } from "@/types/models/patient";

interface ProfileSummaryCardProps {
  patient: PatientRecord | null;
  email?: string | null;
}

export function ProfileSummaryCard({ patient, email }: ProfileSummaryCardProps) {
  if (!patient) return null;

  const displayName = resolveDisplayName([patient.fullName], email, "Patient");

  const rows = [
    {
      icon: Phone,
      label: "Phone",
      value: patient.phone ?? "Not set",
    },
    {
      icon: VenusAndMars,
      label: "Gender",
      value: patient.gender ?? "Not set",
    },
    {
      icon: CalendarDays,
      label: "Birth date",
      value: patient.birthDate ? formatDate(patient.birthDate) : "Not set",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </h3>
          <p className="text-sm text-muted-foreground">Patient profile</p>
        </div>
      </div>

      <dl className="mt-4 space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
                {row.label}
              </dt>
              <dd className="text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
