"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarPlus } from "lucide-react";
import { ProfileSummaryCard } from "@/components/business/ProfileSummaryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { PatientRecord } from "@/types/models/patient";

interface HealthProfileCardProps {
  patient: PatientRecord | null | undefined;
  isLoading?: boolean;
}

export function HealthProfileCard({
  patient,
  isLoading,
}: HealthProfileCardProps) {
  const td = useTranslations("dashboard");
  return (
    <section
      aria-labelledby="health-summary-heading"
      className="flex flex-col gap-4"
    >
      <h2
        id="health-summary-heading"
        className="text-lg font-semibold text-foreground"
      >
        {td("healthSummary")}
      </h2>
      {isLoading ? (
        <Skeleton variant="card" className="h-48" />
      ) : patient ? (
        <div className="max-w-md">
          <ProfileSummaryCard patient={patient} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarPlus className="size-12" />}
            title={td("completeProfile")}
            description={td("completeProfileDesc")}
            action={
              <Link href="/profile">
                <Button>{td("completeProfileBtn")}</Button>
              </Link>
            }
          />
        </div>
      )}
    </section>
  );
}