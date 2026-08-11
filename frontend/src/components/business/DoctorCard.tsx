"use client";

import { memo } from "react";
import type { DoctorReadModel } from "@/types/models/doctor";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/business/StarRating";
import { Avatar } from "@/components/ui/avatar";
import { Award, DollarSign, Building2, Stethoscope } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

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
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer transition-all hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-2 border-primary bg-primary/5 shadow-md"
          : "border-border bg-surface-container-lowest",
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={doctor.doctor.avatarUrl}
            fallback={doctor.doctor.displayName}
            className="size-16 shrink-0"
            width={64}
            height={64}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">
                  {doctor.doctor.displayName}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-primary">
                  <Stethoscope className="size-4" />
                  <span>{doctor.doctor.specialtyName}</span>
                </div>
              </div>
              {typeof rating === "number" && (
                <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
                  <StarRating rating={rating} readonly />
                  <span className="text-xs text-muted-foreground">({rating})</span>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0 text-muted-foreground" />
                <span>{doctor.doctor.clinicName}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                {doctor.experienceYears > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Award className="size-4 text-primary" />
                    <span>{doctor.experienceYears} years experience</span>
                  </div>
                )}
                <div className="flex items-center font-semibold text-on-surface">
                  <DollarSign className="size-4 text-primary" />
                  <span>{formatCurrency(Number(doctor.consultationFee))}</span>
                </div>
              </div>
            </div>

            {doctor.bio && (
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                {doctor.bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
