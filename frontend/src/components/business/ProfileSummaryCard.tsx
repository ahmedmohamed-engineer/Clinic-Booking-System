import { CalendarDays, Phone, User as UserIcon, VenusAndMars } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate, resolveDisplayName } from "@/lib/utils";
import type { PatientRecord } from "@/types/models/patient";

interface ProfileSummaryCardProps {
  patient: PatientRecord | null;
  email?: string | null;
}

export function ProfileSummaryCard({ patient, email }: ProfileSummaryCardProps) {
  const tp = useTranslations("profile");
  const tb = useTranslations("business.profileCard");
  const locale = useLocale();

  if (!patient) return null;

  const displayName = resolveDisplayName([patient.fullName], email, "Patient");

  const rows = [
    {
      icon: Phone,
      label: tp("phone"),
      value: patient.phone ?? tb("notSet"),
    },
    {
      icon: VenusAndMars,
      label: tp("gender"),
      value: patient.gender ?? tb("notSet"),
    },
    {
      icon: CalendarDays,
      label: tp("birthDate"),
      value: patient.birthDate ? formatDate(patient.birthDate, locale) : tb("notSet"),
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
          <p className="text-sm text-muted-foreground">{tb("patientProfile")}</p>
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