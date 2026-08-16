"use client";

import type { ClinicRecord } from "@/types/models/clinic";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

interface ClinicSelectorProps {
  clinics: ClinicRecord[];
  selectedClinicId: string | null;
  onSelect: (clinicId: string) => void;
  isLoading?: boolean;
}

export function ClinicSelector({
  clinics,
  selectedClinicId,
  onSelect,
  isLoading,
}: ClinicSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer h-36 rounded-lg"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No clinics available at the moment.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clinics.map((clinic) => {
        const isSelected = selectedClinicId === clinic.id;
        return (
          <Card
            key={clinic.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => onSelect(clinic.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(clinic.id);
              }
            }}
            className={cn(
              "cursor-pointer transition-all hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/30"
                : "border-border bg-card",
            )}
          >
            {isSelected && (
              <BiroCircle
                className="absolute top-3 right-3 text-primary"
                data-testid="clinic-card-selected"
              />
            )}
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{clinic.name}</h3>
                    {clinic.city && (
                      <span className="text-xs text-muted-foreground">
                        {clinic.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {clinic.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{clinic.address}</span>
                  </div>
                )}
                {clinic.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <span className="tabular">{clinic.phone}</span>
                  </div>
                )}
              </div>

              {clinic.description && (
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                  {clinic.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}