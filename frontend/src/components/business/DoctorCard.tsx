"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import type { DoctorReadModel } from "@/types/models/doctor";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/business/StarRating";
import { Avatar } from "@/components/ui/avatar";
import { Award, DollarSign, Building2, Stethoscope } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

interface DoctorCardProps {
  doctor: DoctorReadModel;
  rating?: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const DoctorCard = memo(function DoctorCard({
  doctor,
  rating,
  isSelected,
  onSelect,
}: DoctorCardProps) {
  const t = useTranslations("doctorCard");
  const { displayName, specialtyName, clinicName } = doctor.doctor;

  // Runtime data can arrive without a fee (optional on the summary model);
  // guard before formatting so we never render "NaN".
  const fee = Number.isFinite(Number(doctor.consultationFee))
    ? Number(doctor.consultationFee)
    : 0;

  // Clamp ratings into the displayable range and keep the readout concise.
  const displayRating =
    typeof rating === "number" && Number.isFinite(rating)
      ? Math.min(5, Math.max(0, rating))
      : undefined;

  const cardLabel = specialtyName
    ? t("selectNameSpecialty", { name: displayName ?? "", specialty: specialtyName })
    : t("selectName", { name: displayName ?? "" });

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={cardLabel}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer transition-all motion-reduce:transition-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/30"
          : "border-border bg-card",
      )}
    >
      {isSelected && (
        <BiroCircle
          className="absolute top-3 right-3 text-primary"
          data-testid="doctor-card-selected"
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={doctor.doctor.avatarUrl}
            fallback={displayName}
            className="size-16 shrink-0"
            width={64}
            height={64}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-foreground">
                  {displayName}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-primary">
                  <Stethoscope className="size-4 shrink-0" />
                  <span className="min-w-0 break-words">{specialtyName}</span>
                </div>
              </div>
              {displayRating !== undefined && (
                <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-status-warning">
                  <StarRating rating={displayRating} readonly />
                  <span className="text-xs text-muted-foreground">
                    ({displayRating.toFixed(1)})
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words">{clinicName}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {doctor.experienceYears > 0 && (
                  <div className="flex min-w-0 items-center gap-1 text-xs">
                    <Award className="size-4 shrink-0 text-primary" />
                    <span className="break-words">
                      {t("yearsExperience", {
                        years: doctor.experienceYears,
                      })}
                    </span>
                  </div>
                )}
                <div className="ml-auto flex shrink-0 items-center font-semibold text-foreground">
                  <DollarSign className="size-4 shrink-0 text-primary" />
                  <span className="tabular">{formatCurrency(fee)}</span>
                </div>
              </div>
            </div>

            {doctor.bio && (
              <p className="mt-3 line-clamp-2 break-words text-xs text-muted-foreground">
                {doctor.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});